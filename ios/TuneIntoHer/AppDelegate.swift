internal import Expo
import React
import UIKit
import QuartzCore
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
#if DEBUG
    window = UIWindow(frame: UIScreen.main.bounds)
    startReactNative(launchOptions: launchOptions)
#else
    let launchWindow = TIHEarlyLaunchWindow(frame: UIScreen.main.bounds)
    window = launchWindow
    launchWindow.startAfterNativeFrame { [weak self] in
      self?.startReactNative(launchOptions: launchOptions)
    }
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  private func startReactNative(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    reactNativeDelegate = delegate
    reactNativeFactory = factory
    factory.startReactNative(withModuleName: "main", in: window, launchOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins
  override func customize(_ rootView: UIView) {
    super.customize(rootView)
    TIHEarlyLaunchWindow.current?.expoSplashInstalled(on: rootView)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

// @generated TIH_EARLY_LAUNCH_BEGIN
// App-owned, static pre-runtime bridge. Generated into AppDelegate by the splash plugin.
// The Expo loading view remains responsible for the later RN/GPU readiness handoff.
final class TIHEarlyLaunchWindow: UIWindow {
  static weak var current: TIHEarlyLaunchWindow?
  private var launchController: UIViewController?
  private var cover: UIView?
  private var link: CADisplayLink?
  private var startReact: (() -> Void)?
  private weak var candidate: RCTSurfaceHostingProxyRootView?
  private var coverFrames = 0
  private var attachedFrames = 0

  override init(frame: CGRect) {
    let name = Bundle.main.object(forInfoDictionaryKey: "UILaunchStoryboardName") as? String ?? "SplashScreen"
    guard let controller = UIStoryboard(name: name, bundle: nil).instantiateInitialViewController() else {
      preconditionFailure("The bundled launch storyboard needs its initial view controller")
    }
    launchController = controller
    super.init(frame: frame)
    Self.current = self
    backgroundColor = controller.view.backgroundColor ?? UIColor(red: 0.44, green: 0.49, blue: 0.57, alpha: 1)
    isOpaque = true
    let initial = TIHLaunchBootstrapController()
    initial.view.backgroundColor = backgroundColor
    rootViewController = initial
    let view = controller.view!
    view.frame = bounds
    view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.isOpaque = true
    cover = view
    makeKeyAndVisible()
    addSubview(view)
    layoutIfNeeded()
    CATransaction.flush()
    trace("COVER_INSTALLED")
  }

  required init?(coder: NSCoder) { fatalError("Use init(frame:)") }

  func startAfterNativeFrame(_ start: @escaping () -> Void) {
    startReact = start
    let displayLink = CADisplayLink(target: self, selector: #selector(onDisplayFrame))
    displayLink.add(to: .main, forMode: .common)
    link = displayLink
  }

  override func didAddSubview(_ subview: UIView) {
    super.didAddSubview(subview)
    if let cover, subview !== cover, cover.superview === self { bringSubviewToFront(cover) }
  }

  func expoSplashInstalled(on root: UIView) {
    // Called after super.customize installs Expo's splash, before the root is mounted.
    guard cover != nil, let host = root as? RCTSurfaceHostingProxyRootView else { return }
    candidate = host
    attachedFrames = 0
    root.backgroundColor = backgroundColor
    trace("EXPO_SPLASH_INSTALLED")
  }

  @objc private func onDisplayFrame() {
    guard !isHidden, UIApplication.shared.applicationState != .background else { return }
    if let start = startReact {
      coverFrames += 1
      // A display callback precedes its frame. Wait for the next callback so a native
      // cover frame can present before expensive factory/Updates/JS initialization.
      guard coverFrames >= 2 else { return }
      startReact = nil
      trace("COVER_FRAME_COMMITTED")
      DispatchQueue.main.async { [weak self] in
        self?.trace("FACTORY_BEGIN")
        #if TIH_NATIVE_LAUNCH_QA
        // Explicit native QA build only; never present in the normal Release binary.
        if ProcessInfo.processInfo.arguments.contains("-TIHStartupStress") {
          let end = CACurrentMediaTime() + 2.5
          var checksum = 0.0
          while CACurrentMediaTime() < end { checksum += sin(checksum + 0.37) }
          self?.trace("QA_FACTORY_PRESSURE_COMPLETE_\(checksum.isFinite)")
        }
        #endif
        start()
      }
      return
    }
    guard let root = candidate, root.window === self, rootViewController?.view === root,
          root.bounds.width > 0, root.bounds.height > 0 else { attachedFrames = 0; return }
    let expo = root.loadingView
    // Visible attached Expo cover, or its intentional hide after JS's first-frame
    // guard. The latter handles a very fast compatible fallback without deadlocking.
    guard (!expo.isHidden && expo.window === self && expo.superview != nil) || expo.isHidden else {
      attachedFrames = 0; return
    }
    attachedFrames += 1
    guard attachedFrames >= 2 else { return }
    trace("EARLY_COVER_HANDOFF")
    cover?.removeFromSuperview()
    cover = nil
    launchController = nil
    candidate = nil
    link?.invalidate()
    link = nil
    Self.current = nil
  }

  private func trace(_ stage: String) {
    NSLog("TIH_NATIVE_LAUNCH %@ %.6f", stage, CACurrentMediaTime())
  }
}

private final class TIHLaunchBootstrapController: UIViewController {
  override var preferredStatusBarStyle: UIStatusBarStyle { .darkContent }
}
// @generated TIH_EARLY_LAUNCH_END
