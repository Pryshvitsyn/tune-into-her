import XCTest
import UIKit

final class LaunchUIQA: XCTestCase {
  override func setUpWithError() throws {
    try super.setUpWithError()
    #if targetEnvironment(simulator)
    guard ProcessInfo.processInfo.environment["SIMULATOR_UDID"] == "32C5B1E9-BE95-4BC1-8B76-4CE7D2A9979B" else {
      throw XCTSkip("This harness may drive only the isolated Tune Into Her Launch QA simulator.")
    }
    #else
    throw XCTSkip("This harness must never drive a physical device.")
    #endif
  }
  func testDiscoverOnboarding() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    app.launch()
    XCTAssertTrue(app.wait(for: .runningForeground, timeout: 15))
    let continueButton = app.buttons["Continue"]
    _ = continueButton.waitForExistence(timeout: 30)
    print("TIH_AX_BEGIN\n\(app.debugDescription)\nTIH_AX_END")
    let capture = XCTAttachment(screenshot: app.screenshot())
    capture.name = "01-onboarding-discovery"
    capture.lifetime = .keepAlways
    add(capture)
    XCTAssertTrue(continueButton.exists)
  }
  func testOpenLanguageDiscovery() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    app.activate()
    for _ in 0..<6 {
      if app.buttons["Select English"].exists { break }
      if app.buttons["Back"].exists { app.buttons["Back"].tap() }
    }
    XCTAssertTrue(app.buttons["Select English"].waitForExistence(timeout: 30))
    app.buttons["Select English"].tap()
    XCTAssertTrue(app.buttons["Cancel"].waitForExistence(timeout: 5))
    print("TIH_LANGUAGE_AX_BEGIN\n\(app.debugDescription)\nTIH_LANGUAGE_AX_END")
    let capture = XCTAttachment(screenshot: app.screenshot())
    capture.name = "02-language-wheel"
    capture.lifetime = .keepAlways
    add(capture)
    app.buttons["Cancel"].tap()
    XCTAssertTrue(app.buttons["Select English"].waitForExistence(timeout: 5))
  }

}

extension LaunchUIQA {
  func openMotionSettings(in settings: XCUIApplication) -> XCUIElement {
    let reduce = settings.switches["Reduce Motion"].firstMatch
    if reduce.waitForExistence(timeout: 2) { return reduce }
    func reveal(_ element: XCUIElement) {
      let scroll = settings.scrollViews.firstMatch.exists ? settings.scrollViews.firstMatch : settings.tables.firstMatch.exists ? settings.tables.firstMatch : settings.collectionViews.firstMatch
      for _ in 0..<16 {
        let bounds = scroll.exists ? scroll.frame.intersection(settings.frame) : settings.frame
        let navigation = settings.navigationBars.firstMatch
        let top = max(bounds.minY, navigation.exists ? navigation.frame.maxY : bounds.minY) + 12
        let bottom = bounds.maxY - 12
        if element.exists && element.isHittable && element.frame.minY >= top && element.frame.maxY <= bottom { return }
        let needed = element.exists && element.frame.minY < top
          ? top - element.frame.minY : element.exists ? bottom - element.frame.maxY : -bounds.height * 0.3
        let distance = max(-bounds.height * 0.3, min(bounds.height * 0.3, needed))
        let start = settings.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.55))
        start.press(forDuration: 0.05, thenDragTo: start.withOffset(CGVector(dx: 0, dy: distance)), withVelocity: .slow, thenHoldForDuration: 0.1)
      }
      XCTAssertTrue(element.isHittable, "Native Settings row must be revealed before tapping")
    }
    let motion = settings.buttons["MOTION_TITLE"].firstMatch
    // Recover an unrelated retained Settings subpage (for example Apps) through its
    // native BackButton. Select actual row buttons, not their label/image children.
    for _ in 0..<8 {
      if motion.exists || reduce.exists { break }
      let back = settings.navigationBars.buttons["BackButton"].firstMatch
      if !back.exists { break }
      back.tap()
    }
    if reduce.exists { return reduce }
    if !motion.exists {
      let accessibility = settings.buttons["Accessibility"].firstMatch
      reveal(accessibility)
      accessibility.tap()
      capture(settings, "44-motion-accessibility-page-discovery", checkStatusBar: false)
    }
    reveal(motion)
    print("TIH_NATIVE_MOTION_BUTTON frame=\(motion.frame) enabled=\(motion.isEnabled)")
    motion.tap()
    capture(settings, "12-motion-page-after-native-row-tap", checkStatusBar: false)
    return reduce
  }
  func capture(_ app: XCUIApplication, _ name: String, checkStatusBar: Bool = true) {
    print("TIH_\(name)_AX_BEGIN\n\(app.debugDescription)\nTIH_\(name)_AX_END")
    let screenshot = app.screenshot()
    let attachment = XCTAttachment(screenshot: screenshot)
    attachment.name = name
    attachment.lifetime = .keepAlways
    add(attachment)
    if checkStatusBar {
      guard let image = screenshot.image.cgImage, let pixels = statusBarReadability(in: image) else {
        XCTFail("Cannot read the native screenshot pixel buffer")
        return
      }
      print("TIH_STATUS_BAR_PIXELS \(name) background=\(pixels.backgroundRGB) dark=\(pixels.darkBackground) whiteClockPixels=\(pixels.whiteClockPixels)")
      if pixels.darkBackground {
        XCTAssertGreaterThan(pixels.whiteClockPixels, 80, "Graphite screens require readable white status-bar clock pixels")
      }
    }
  }
  func makeVisible(_ element: XCUIElement, in app: XCUIApplication) {
    for _ in 0..<8 {
      if element.isHittable { return }
      app.scrollViews.firstMatch.swipeUp(velocity: .slow)
    }
  }
  func testLanguageCancelDoneAndOnboarding() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    app.launch()
    try completeOnboardingAssertions(in: app)
  }
  func completeOnboardingAssertions(in app: XCUIApplication, expectFreshDate: Bool = true) throws {
    for _ in 0..<6 {
      if app.buttons["Select English"].exists { break }
      if app.buttons["Back"].exists { app.buttons["Back"].tap() }
    }
    XCTAssertTrue(app.buttons["Select English"].waitForExistence(timeout: 30))
    makeVisible(app.buttons["Select English"], in: app)
    app.buttons["Select English"].tap()
    let wheel = app.otherElements["Language"].firstMatch
    XCTAssertTrue(wheel.waitForExistence(timeout: 5))
    XCTAssertEqual(wheel.value as? String, "English")
    wheel.swipeUp(velocity: .slow)
    XCTAssertNotEqual(wheel.value as? String, "English", "Wheel gesture must change the draft before Cancel")
    capture(app, "03-language-changed-draft")
    app.buttons["Cancel"].tap()
    XCTAssertTrue(app.buttons["Select English"].waitForExistence(timeout: 5))
    app.buttons["Select English"].tap()
    XCTAssertTrue(wheel.waitForExistence(timeout: 5))
    XCTAssertEqual(wheel.value as? String, "English", "Cancel must discard the changed draft")
    app.buttons["Done"].tap()
    XCTAssertTrue(app.buttons["Select English"].waitForExistence(timeout: 5))
    capture(app, "04-language-confirmed-English")
    app.buttons["Continue"].tap()
    let context = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Context,")).firstMatch
    XCTAssertTrue(context.waitForExistence(timeout: 5))
    XCTAssertEqual(context.label, "Context,\nnever a prediction")
    XCTAssertEqual(context.frame.height, 76, accuracy: 1, "Default-size English title must occupy two 38pt lines")
    capture(app, "05-context-two-lines")
    app.buttons["Continue"].tap()
    XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout: 3))
    XCTAssertTrue(app.alerts.staticTexts["Please acknowledge this before continuing."].exists)
    app.alerts.buttons["OK"].tap()
    let acknowledgement = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "I understand and will use estimates respectfully")).firstMatch
    makeVisible(acknowledgement, in: app)
    XCTAssertTrue(acknowledgement.isHittable)
    acknowledgement.tap()
    app.buttons["Continue"].tap()
    XCTAssertTrue(app.staticTexts["When did the last period begin?"].firstMatch.waitForExistence(timeout: 5))
    try confirmSyntheticDraftDateIfNeeded(in: app, expectFresh: expectFreshDate)
    capture(app, "06-synthetic-date-explicitly-confirmed")
    app.buttons["Continue"].tap()
    XCTAssertTrue(app.staticTexts["What is typical?"].firstMatch.waitForExistence(timeout: 5))
    XCTAssertTrue(app.staticTexts["28 days"].firstMatch.exists)
    XCTAssertTrue(app.staticTexts["5 days"].firstMatch.exists)
    capture(app, "07-default-cycle-28-period-5")
    app.buttons["Continue"].tap()
    XCTAssertTrue(app.staticTexts["Here’s today at a glance"].firstMatch.waitForExistence(timeout: 5))
    let mind = app.staticTexts["KEEP IN MIND"].firstMatch
    let support = app.staticTexts["SUPPORT"].firstMatch
    let action = app.staticTexts["DO"].firstMatch
    XCTAssertTrue(mind.exists)
    XCTAssertTrue(support.exists)
    XCTAssertTrue(action.exists)
    XCTAssertLessThan(mind.frame.minY, support.frame.minY)
    XCTAssertLessThan(support.frame.minY, action.frame.minY)
    capture(app, "08-preview-keep-support-do")
    makeVisible(action, in: app)
    capture(app, "09-preview-scrolled-do")
    app.buttons["Continue"].tap()
    XCTAssertTrue(app.staticTexts["One reminder a day"].firstMatch.waitForExistence(timeout: 5))
    let reminder = app.switches.firstMatch
    XCTAssertTrue(reminder.exists)
    if reminder.value as? String == "1" { reminder.tap() }
    XCTAssertEqual(reminder.value as? String, "0")
    capture(app, "10-reminder-disabled")
    app.buttons["Open today"].tap()
    XCTAssertTrue(app.staticTexts["One useful cue every day."].firstMatch.waitForExistence(timeout: 15))
    XCTAssertFalse(app.staticTexts["KEEP IN MIND"].firstMatch.exists)
    capture(app, "11-existing-paywall-no-purchase")
  }
}

extension LaunchUIQA {
  func testConfirmReducedMotionAtCurrentSettingsScreen() throws {
    continueAfterFailure = false
    let settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
    settings.activate()
    let reduce = openMotionSettings(in: settings)
    XCTAssertTrue(reduce.waitForExistence(timeout: 5))
    capture(settings, "13a-motion-settings-before", checkStatusBar: false)
    if reduce.value as? String != "1" {
      let control = reduce.descendants(matching: .switch).firstMatch
      XCTAssertTrue(control.exists)
      control.tap()
    }
    let enabled = NSPredicate(format: "value == %@", "1")
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: enabled, object: reduce)], timeout: 5), .completed)
    XCTAssertTrue(UIAccessibility.isReduceMotionEnabled, "UIKit must observe the enabled native preference")
    print("TIH_REDUCED_MOTION_ENABLED_UIKIT \(UIAccessibility.isReduceMotionEnabled)")
    capture(settings, "13-qa-reduce-motion-enabled", checkStatusBar: false)
  }
}

extension LaunchUIQA {
  func testRestoreReducedMotionOffAtCurrentSettingsScreen() throws {
    continueAfterFailure = false
    let settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
    settings.activate()
    let reduce = openMotionSettings(in: settings)
    XCTAssertTrue(reduce.waitForExistence(timeout: 5))
    capture(settings, "14a-motion-settings-before-restore", checkStatusBar: false)
    let disabled = NSPredicate(format: "value == %@", "0")
    func isOffWithin(_ seconds: TimeInterval) -> Bool {
      XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: disabled, object: reduce)], timeout: seconds) == .completed
    }
    if reduce.value as? String != "0" {
      // iOS26 exposes a full-row Switch with a separate native UISwitch child.
      // Drive the actual control rather than the row's accessibility hit target.
      let control = reduce.descendants(matching: .switch).firstMatch
      XCTAssertTrue(control.exists)
      print("TIH_REDUCE_MOTION_INNER_CONTROL \(control.debugDescription)")
      control.tap()
      if !isOffWithin(2) {
        let onThumb = control.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.5))
        let offThumb = control.coordinate(withNormalizedOffset: CGVector(dx: 0.15, dy: 0.5))
        onThumb.press(forDuration: 0.15, thenDragTo: offThumb)
      }
    }
    let restored = isOffWithin(5)
    capture(settings, "14-qa-reduce-motion-restored-off", checkStatusBar: false)
    XCTAssertTrue(restored, "The native Reduce Motion switch must report OFF")
    XCTAssertFalse(UIAccessibility.isReduceMotionEnabled, "UIKit must observe the restored OFF preference")
    print("TIH_REDUCED_MOTION_RESTORED_UIKIT \(UIAccessibility.isReduceMotionEnabled)")
  }
}

extension LaunchUIQA {
  func testWarmSettingsAdviceStaysLockedWithoutIntro() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    XCTAssertNotEqual(app.state, .notRunning, "This scenario must reuse the already running application")
    let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
    for owner in [springboard, app] {
      let alert = owner.alerts.firstMatch
      if alert.exists {
        capture(owner, "15a-existing-open-confirmation", checkStatusBar: false)
        XCTAssertTrue(alert.buttons["Open"].exists)
        alert.buttons["Open"].tap()
      }
    }
    app.activate()
    let locked = app.staticTexts["An active trial or subscription unlocks today’s context."].firstMatch
    XCTAssertTrue(locked.waitForExistence(timeout: 5))
    let initialDescription = app.debugDescription
    let processRange = try XCTUnwrap(initialDescription.range(of: "pid: [0-9]+", options: .regularExpression))
    let process = String(initialDescription[processRange])
    capture(app, "15b-warm-locked-before-navigation")
    let settings = app.buttons.matching(NSPredicate(format: "label CONTAINS[cd] %@", "Settings")).firstMatch
    if settings.exists && settings.isHittable { settings.tap() }
    else { app.coordinate(withNormalizedOffset: CGVector(dx: 0.83, dy: 0.95)).tap() }
    let cycleDetails = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Cycle details")).firstMatch
    XCTAssertTrue(cycleDetails.waitForExistence(timeout: 3))
    capture(app, "16-warm-settings")
    let advice = app.buttons.matching(NSPredicate(format: "label CONTAINS[cd] %@", "Advice")).firstMatch
    let navigationStarted = Date()
    if advice.exists && advice.isHittable { advice.tap() }
    else { app.coordinate(withNormalizedOffset: CGVector(dx: 0.16, dy: 0.95)).tap() }
    XCTAssertTrue(locked.waitForExistence(timeout: 3), "Locked Today must appear without replaying the nine-second intro")
    XCTAssertLessThan(Date().timeIntervalSince(navigationStarted), 5)
    XCTAssertTrue(app.buttons["View subscription"].exists)
    XCTAssertFalse(app.staticTexts["KEEP IN MIND"].firstMatch.exists)
    let finalDescription = app.debugDescription
    let finalProcessRange = try XCTUnwrap(finalDescription.range(of: "pid: [0-9]+", options: .regularExpression))
    XCTAssertEqual(String(finalDescription[finalProcessRange]), process)
    capture(app, "17-warm-advice-locked-no-intro")
  }
}

extension LaunchUIQA {
  func testAllElevenPickerValuesCancelPreservesEnglish() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    app.activate()
    XCTAssertTrue(app.buttons["Select English"].waitForExistence(timeout: 30))
    makeVisible(app.buttons["Select English"], in: app)
    app.buttons["Select English"].tap()
    let wheel = app.otherElements["Language"].firstMatch
    XCTAssertTrue(wheel.waitForExistence(timeout: 5))
    let labels = ["English", "Français", "Italiano", "Español", "Deutsch", "Русский", "Українська", "हिन्दी", "简体中文", "Bahasa Melayu", "Baba Melayu · Peranakan"]
    XCTAssertEqual(wheel.value as? String, labels[0])
    capture(app, "18-picker-00-English")
    for index in 1..<labels.count {
      // Default-size wheel displays exactly five equal native-measured rows.
      let rowHeight = wheel.frame.height / 5
      XCTAssertGreaterThanOrEqual(rowHeight, 52)
      let start = wheel.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
      let end = start.withOffset(CGVector(dx: 0, dy: -rowHeight))
      start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.4)
      let expected = NSPredicate(format: "value == %@", labels[index])
      let result = XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: expected, object: wheel)], timeout: 3)
      print("TIH_PICKER_LANGUAGE_OBSERVED index=\(index) expected=\(labels[index]) value=\(String(describing: wheel.value))")
      capture(app, "18-picker-\(String(format: "%02d", index))-native-value")
      if result != .completed { app.buttons["Cancel"].tap() }
      XCTAssertEqual(result, .completed, "Every supported native picker value must be observed in order")
    }
    app.buttons["Cancel"].tap()
    XCTAssertTrue(app.buttons["Select English"].waitForExistence(timeout: 5))
    capture(app, "19-picker-all-eleven-cancel-English")
  }
}

extension LaunchUIQA {
  func testLargestTypeWelcomePickerActionsReachable() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    app.activate()
    let selected = app.buttons["Select English"]
    XCTAssertTrue(selected.waitForExistence(timeout: 30))
    makeVisible(selected, in: app)
    XCTAssertTrue(selected.isHittable, "The language row must be reachable at the largest system text size")
    capture(app, "20-largest-type-welcome-scrolled")
    selected.tap()
    let cancel = app.buttons["Cancel"]
    let done = app.buttons["Done"]
    XCTAssertTrue(cancel.waitForExistence(timeout: 5))
    XCTAssertTrue(done.exists)
    func fullyVisible(_ button: XCUIElement) -> Bool {
      button.isHittable && app.frame.contains(button.frame)
    }
    for _ in 0..<10 {
      if fullyVisible(cancel) && fullyVisible(done) { break }
      guard let scroll = app.scrollViews.allElementsBoundByIndex.last else { break }
      scroll.swipeUp(velocity: .slow)
    }
    capture(app, "21-largest-type-picker-actions")
    XCTAssertTrue(fullyVisible(cancel), "The full Cancel control must remain visible and reachable at the largest text size")
    XCTAssertTrue(fullyVisible(done), "The full Done control must remain visible and reachable at the largest text size")
    cancel.tap()
    XCTAssertTrue(selected.waitForExistence(timeout: 5))
    capture(app, "22-largest-type-cancel-English")
  }
}

extension LaunchUIQA {
  func testLargestTypeContextAndTypicalInspectionNoSave() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    app.activate()
    for _ in 0..<3 {
      if app.buttons["Select English"].exists { break }
      if app.buttons["Back"].exists { app.buttons["Back"].tap() }
    }
    XCTAssertTrue(app.buttons["Select English"].waitForExistence(timeout: 20))
    app.buttons["Continue"].tap()
    let context = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Context,")).firstMatch
    XCTAssertTrue(context.waitForExistence(timeout: 5))
    let acknowledgement = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", "I understand and will use estimates respectfully")).firstMatch
    for _ in 0..<30 {
      let scroll = app.scrollViews.firstMatch
      let body = scroll.frame
      if !acknowledgement.exists { scroll.swipeUp(velocity: .slow); continue }
      let center = acknowledgement.frame.midY
      if acknowledgement.isHittable && center >= body.minY + 30 && center <= body.maxY - 30 { break }
      let delta = max(-body.height * 0.4, min(body.height * 0.4, center - body.midY))
      let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
      start.press(forDuration: 0.1, thenDragTo: start.withOffset(CGVector(dx: 0, dy: -delta)), withVelocity: .slow, thenHoldForDuration: 0.3)
    }
    XCTAssertTrue(acknowledgement.isHittable)
    XCTAssertGreaterThanOrEqual(acknowledgement.frame.midY, app.scrollViews.firstMatch.frame.minY + 26)
    XCTAssertLessThanOrEqual(acknowledgement.frame.midY, app.scrollViews.firstMatch.frame.maxY - 26)
    capture(app, "23-largest-type-context-before-check")
    if String(describing: acknowledgement.value).contains("unchecked") { acknowledgement.tap() }
    capture(app, "24-largest-type-context-checked")
    app.buttons["Continue"].tap()
    XCTAssertTrue(app.staticTexts["When did the last period begin?"].firstMatch.waitForExistence(timeout: 5))
    try confirmSyntheticDraftDateIfNeeded(in: app)
    capture(app, "25-largest-type-date-explicit-draft-no-save")
    app.buttons["Continue"].tap()
    XCTAssertTrue(app.staticTexts["What is typical?"].firstMatch.waitForExistence(timeout: 5))
    let controls = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Cycle length"))
    XCTAssertEqual(controls.count, 2)
    for _ in 0..<16 {
      let body = app.scrollViews.firstMatch.frame
      if controls.firstMatch.exists && controls.firstMatch.isHittable && body.contains(controls.firstMatch.frame) { break }
      if controls.firstMatch.exists && controls.firstMatch.frame.minY < body.minY { app.scrollViews.firstMatch.swipeDown(velocity: .slow) }
      else { app.scrollViews.firstMatch.swipeUp(velocity: .slow) }
    }
    XCTAssertTrue(controls.firstMatch.isHittable)
    XCTAssertTrue(app.scrollViews.firstMatch.frame.contains(controls.firstMatch.frame))
    capture(app, "26-largest-type-typical-steppers-no-change")
    // Stop before preview Continue, which is the existing cycle-persistence boundary.
    for _ in 0..<3 { app.buttons["Back"].tap() }
    XCTAssertTrue(app.buttons["Select English"].waitForExistence(timeout: 5))
    capture(app, "27-largest-type-returned-welcome-no-save")
  }
}

extension LaunchUIQA {
  func testSelectDarkThemeWelcomeContextNoSave() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
    for owner in [springboard, app] {
      let alert = owner.alerts.firstMatch
      if alert.exists {
        XCTAssertTrue(alert.buttons["Open"].exists)
        alert.buttons["Open"].tap()
      }
    }
    app.activate()
    let dark = app.descendants(matching: .any).matching(NSPredicate(format: "label ENDSWITH %@", "Dark")).firstMatch
    XCTAssertTrue(dark.waitForExistence(timeout: 5))
    dark.tap()
    let saved = NSPredicate(format: "enabled == true AND label CONTAINS %@", "●")
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: saved, object: dark)], timeout: 5), .completed)
    capture(app, "28-dark-appearance-selected-saved")
    let selected = app.buttons["Select English"]
    for _ in 0..<4 {
      if selected.waitForExistence(timeout: 1) { break }
      if app.buttons["Back"].firstMatch.exists { app.buttons["Back"].firstMatch.tap() }
      else { break }
    }
    XCTAssertTrue(selected.waitForExistence(timeout: 5))
    capture(app, "29-dark-welcome")
    app.buttons["Continue"].tap()
    let context = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Context,")).firstMatch
    XCTAssertTrue(context.waitForExistence(timeout: 5))
    XCTAssertEqual(context.label, "Context,\nnever a prediction")
    XCTAssertEqual(context.frame.height, 76, accuracy: 1)
    capture(app, "30-dark-context-two-lines")
    app.buttons["Back"].tap()
    XCTAssertTrue(selected.waitForExistence(timeout: 5))
    capture(app, "31-dark-returned-welcome-no-save")
  }
}

extension LaunchUIQA {
  func clearExistingOpenConfirmation(for app: XCUIApplication) {
    let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
    for owner in [springboard, app] {
      let alert = owner.alerts.firstMatch
      if alert.exists {
        XCTAssertTrue(alert.buttons["Open"].exists)
        alert.buttons["Open"].tap()
      }
    }
  }
  func testSelectLightThemeForFinalRevisit() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    clearExistingOpenConfirmation(for: app)
    app.activate()
    let light = app.descendants(matching: .any).matching(NSPredicate(format: "label ENDSWITH %@", "Light")).firstMatch
    XCTAssertTrue(light.waitForExistence(timeout: 30))
    light.tap()
    let saved = NSPredicate(format: "enabled == true AND label CONTAINS %@", "●")
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: saved, object: light)], timeout: 5), .completed)
    capture(app, "32-light-appearance-selected-saved")
  }
  func testFinalLightRevisitFullOnboardingNoReset() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    clearExistingOpenConfirmation(for: app)
    app.activate()
    try completeOnboardingAssertions(in: app, expectFreshDate: false)
  }
}

extension LaunchUIQA {
  /// Read-only navigation on the isolated simulator's existing English/no-access fixture.
  /// Never selects a theme/language, changes cycle data, or invokes subscription controls.
  func testTypographySettingsHistoryAndScriptHeadersNoWrites() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    XCTAssertNotEqual(app.state, .notRunning, "Requires the already running English QA app on locked Today")
    clearExistingOpenConfirmation(for: app)
    app.activate()
    let locked = app.staticTexts["An active trial or subscription unlocks today’s context."].firstMatch
    XCTAssertTrue(locked.waitForExistence(timeout: 10), "Open the existing locked Today route before this read-only scenario")
    XCTAssertFalse(app.staticTexts["KEEP IN MIND"].firstMatch.exists)
    let initial = app.debugDescription
    let initialProcessRange = try XCTUnwrap(initial.range(of: "pid: [0-9]+", options: .regularExpression))
    let process = String(initial[initialProcessRange])

    func requireFullyVisible(_ element: XCUIElement, _ message: String) {
      for _ in 0..<12 {
        let scroll = app.scrollViews.firstMatch
        let visible = scroll.exists ? scroll.frame.intersection(app.frame) : app.frame
        if element.exists && element.isHittable && visible.contains(element.frame) { break }
        guard scroll.exists else { break }
        let distance: CGFloat
        if element.exists {
          let needed = element.frame.minY < visible.minY
            ? visible.minY - element.frame.minY + 12
            : visible.maxY - element.frame.maxY - 12
          distance = max(-visible.height * 0.4, min(visible.height * 0.4, needed))
        } else { distance = -visible.height * 0.4 }
        // Small measured drags avoid bouncing a near-edge row between both scroll ends.
        let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        let end = start.withOffset(CGVector(dx: 0, dy: distance))
        start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.1)
      }
      XCTAssertTrue(element.exists, message)
      XCTAssertTrue(element.isHittable, message)
      XCTAssertTrue(app.frame.contains(element.frame), message)
      if app.scrollViews.firstMatch.exists {
        XCTAssertTrue(app.scrollViews.firstMatch.frame.contains(element.frame), message)
      }
    }
    func tapBottomTab(_ label: String) {
      // The actual RN tab AX nodes are Other (e.g. "⚙, Settings"), not Button.
      let tab = app.otherElements.matching(NSPredicate(format: "label ENDSWITH %@", ", \(label)")).firstMatch
      XCTAssertTrue(tab.waitForExistence(timeout: 5), "Expected the existing native \(label) tab")
      print("TIH_TYPOGRAPHY_NATIVE_TAB \(label) frame=\(tab.frame) hittable=\(tab.isHittable)")
      XCTAssertTrue(tab.isHittable)
      XCTAssertTrue(app.frame.contains(tab.frame))
      tab.tap()
      capture(app, "33a-typography-after-\(label)-tab")
    }
    func returnToSettings() {
      let back = app.buttons["Back"].firstMatch
      requireFullyVisible(back, "Native Back control must remain visible and accessible")
      back.tap()
      XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Cycle details")).firstMatch.waitForExistence(timeout: 5))
    }

    capture(app, "33-typography-locked-today")
    tapBottomTab("Settings")
    let cycleDetails = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Cycle details")).firstMatch
    XCTAssertTrue(cycleDetails.waitForExistence(timeout: 5))
    let settingsTitle = app.staticTexts["Settings"].firstMatch
    requireFullyVisible(settingsTitle, "Settings title must have complete native text bounds")
    capture(app, "34-typography-settings")

    let appearance = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Appearance")).firstMatch
    requireFullyVisible(appearance, "Appearance navigation row must be fully reachable")
    appearance.tap()
    let appearanceTitle = app.staticTexts["Appearance"].firstMatch
    XCTAssertTrue(appearanceTitle.waitForExistence(timeout: 5))
    requireFullyVisible(appearanceTitle, "Appearance title must have complete native text bounds")
    XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(format: "label ENDSWITH %@", "Light")).firstMatch.exists)
    XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(format: "label ENDSWITH %@", "Dark")).firstMatch.exists)
    capture(app, "35-typography-appearance-no-selection")
    returnToSettings()

    let english = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "English")).firstMatch
    requireFullyVisible(english, "Existing English language preference must remain visible")
    english.tap()
    let languageTitle = app.staticTexts["Language"].firstMatch
    XCTAssertTrue(languageTitle.waitForExistence(timeout: 5))
    requireFullyVisible(languageTitle, "Language title must have complete native text bounds")
    capture(app, "36-typography-language-latin-header")
    let hindi = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "हिन्दी")).firstMatch
    let chinese = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "简体中文")).firstMatch
    requireFullyVisible(hindi, "Hindi option must be readable without selecting it")
    requireFullyVisible(chinese, "Chinese option must be readable without selecting it")
    capture(app, "37-typography-language-script-fallbacks-no-selection")
    returnToSettings()
    requireFullyVisible(english, "Read-only language inspection must preserve saved English")

    tapBottomTab("Advice")
    XCTAssertTrue(locked.waitForExistence(timeout: 5))
    let previousDays = app.buttons["Previous days"].firstMatch
    requireFullyVisible(previousDays, "Previous days navigation must remain reachable")
    previousDays.tap()
    let historyTitle = app.staticTexts["Previous guidance"].firstMatch
    XCTAssertTrue(historyTitle.waitForExistence(timeout: 5))
    requireFullyVisible(historyTitle, "History title must have complete native text bounds")
    let emptyHistory = app.staticTexts["No previous guidance yet."].firstMatch
    XCTAssertTrue(emptyHistory.waitForExistence(timeout: 5), "Requires the existing no-access QA fixture with no guidance history")
    requireFullyVisible(emptyHistory, "Empty-history typography must be fully visible")
    capture(app, "38-typography-history-empty-no-access")
    let back = app.buttons["Back"].firstMatch
    requireFullyVisible(back, "History Back control must remain reachable")
    back.tap()
    XCTAssertTrue(locked.waitForExistence(timeout: 5))
    XCTAssertFalse(app.staticTexts["KEEP IN MIND"].firstMatch.exists)
    let final = app.debugDescription
    let finalProcessRange = try XCTUnwrap(final.range(of: "pid: [0-9]+", options: .regularExpression))
    XCTAssertEqual(String(final[finalProcessRange]), process, "Navigation must reuse the existing process without a cold intro")
    capture(app, "39-typography-returned-locked-today-no-writes")
  }
}

extension LaunchUIQA {
  /// Requires the guarded QA app already on /cycle, English, maximum system text.
  /// Inspects the existing synthetic calendar without Edit, Save or month navigation.
  func testLargestTypeCalendarNoWrites() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    XCTAssertNotEqual(app.state, .notRunning)
    app.activate()
    clearExistingOpenConfirmation(for: app)
    let outer = app.scrollViews.firstMatch
    XCTAssertTrue(outer.waitForExistence(timeout: 10))
    let grid = outer.scrollViews.firstMatch
    XCTAssertTrue(grid.waitForExistence(timeout: 5), "Expected the native horizontal calendar viewport")
    XCTAssertGreaterThan(grid.frame.width, 0)
    XCTAssertLessThanOrEqual(grid.frame.width, outer.frame.width + 1)

    func moveVerticallyTo(_ element: XCUIElement) {
      for _ in 0..<16 {
        let visible = outer.frame.intersection(app.frame)
        if element.exists && element.frame.minY >= visible.minY && element.frame.maxY <= visible.maxY { return }
        let delta = element.exists
          ? (element.frame.minY < visible.minY ? visible.minY - element.frame.minY + 12 : visible.maxY - element.frame.maxY - 12)
          : -visible.height * 0.35
        let distance = max(-visible.height * 0.35, min(visible.height * 0.35, delta))
        let start = outer.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        start.press(forDuration: 0.05, thenDragTo: start.withOffset(CGVector(dx: 0, dy: distance)), withVelocity: .slow, thenHoldForDuration: 0.1)
      }
    }
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US")
    formatter.dateFormat = "MMMM yyyy"
    let monthName = formatter.string(from: Date())
    let monthTitle = app.staticTexts[monthName].firstMatch
    XCTAssertTrue(monthTitle.waitForExistence(timeout: 5), "Inspect only the existing current month")
    moveVerticallyTo(monthTitle)
    XCTAssertTrue(outer.frame.contains(monthTitle.frame))
    capture(app, "40-largest-type-calendar-current-month-no-change")

    let parts = Calendar(identifier: .gregorian).dateComponents([.month, .year], from: Date())
    let month = try XCTUnwrap(parts.month), year = try XCTUnwrap(parts.year)
    let dateLabel = "\(month)/28/\(year)"
    let day = grid.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", dateLabel)).firstMatch
    XCTAssertTrue(day.waitForExistence(timeout: 5), "The current month's existing 28th must be present")
    moveVerticallyTo(day)
    var horizontalDrags = 0
    for _ in 0..<18 {
      let visible = grid.frame.intersection(outer.frame).intersection(app.frame)
      if day.isHittable && visible.contains(day.frame) { break }
      let delta = day.frame.minX < visible.minX
        ? visible.minX - day.frame.minX + 12 : visible.maxX - day.frame.maxX - 12
      let distance = max(-visible.width * 0.35, min(visible.width * 0.35, delta))
      let origin = app.coordinate(withNormalizedOffset: CGVector(dx: 0, dy: 0))
      let start = origin.withOffset(CGVector(dx: visible.midX - app.frame.minX, dy: visible.midY - app.frame.minY))
      start.press(forDuration: 0.05, thenDragTo: start.withOffset(CGVector(dx: distance, dy: 0)), withVelocity: .slow, thenHoldForDuration: 0.1)
      horizontalDrags += 1
    }
    let visible = grid.frame.intersection(outer.frame).intersection(app.frame)
    print("TIH_MAX_CALENDAR date=\(dateLabel) viewport=\(grid.frame) visible=\(visible) day=\(day.frame) horizontalDrags=\(horizontalDrags)")
    capture(app, "41-largest-type-calendar-complete-two-digit-28")
    XCTAssertTrue(day.isHittable)
    XCTAssertTrue(visible.contains(day.frame), "The entire two-digit date must fit inside both native scroll viewports")
    XCTAssertGreaterThan(day.frame.height, 50, "Requires maximum system text rather than a default-size calendar")
    XCTAssertGreaterThan(day.frame.width, 60, "Both large digits and existing padding must fit without squeezing into the old narrow column")
    XCTAssertTrue(monthTitle.exists, "Horizontal inspection must retain the original month")
    XCTAssertFalse(app.buttons["Save"].exists, "Calendar inspection must never enter the editing flow")
    capture(app, "41a-largest-type-calendar-readable-stacked-tabs")
    var previousBottom = -CGFloat.greatestFiniteMagnitude
    for label in ["Advice", "Cycle", "Settings"] {
      let tab = app.otherElements.matching(NSPredicate(format: "label == %@ OR label ENDSWITH %@", label, ", \(label)")).firstMatch
      XCTAssertTrue(tab.exists, "Expected the actual native \(label) tab")
      print("TIH_MAX_CALENDAR_TAB label=\(tab.label) frame=\(tab.frame) hittable=\(tab.isHittable)")
      XCTAssertTrue(tab.isHittable, "Each maximum-text navigation row must be reachable")
      XCTAssertTrue(app.frame.contains(tab.frame), "The complete \(label) tab must remain visible")
      XCTAssertGreaterThanOrEqual(tab.frame.width, app.frame.width * 0.9, "Maximum-text tabs need full-width rows for readable labels")
      XCTAssertGreaterThan(tab.frame.height, 0)
      XCTAssertGreaterThanOrEqual(tab.frame.minY, previousBottom - 0.5, "Maximum-text tabs must stack vertically without overlapping")
      previousBottom = tab.frame.maxY
    }
  }
}


extension LaunchUIQA {
  /// Requires the QA simulator's native Reduce Motion preference already confirmed ON.
  func testReducedMotionColdLaunchShowsLockedEntry() throws {
    continueAfterFailure = false
    XCTAssertTrue(UIAccessibility.isReduceMotionEnabled, "The native QA preference must actually be ON")
    print("TIH_REDUCED_MOTION_UIKIT true")
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    print("TIH_REDUCED_MOTION_COLD_BEGIN \(Date().timeIntervalSince1970)")
    app.terminate()
    app.launch()
    let locked = app.staticTexts["An active trial or subscription unlocks today’s context."].firstMatch
    XCTAssertTrue(locked.waitForExistence(timeout: 15))
    print("TIH_REDUCED_MOTION_COLD_LOCKED \(Date().timeIntervalSince1970)")
    XCTAssertFalse(app.staticTexts["KEEP IN MIND"].firstMatch.exists)
    capture(app, "42-reduced-motion-cold-locked-entry-no-full-intro")
  }
}


extension LaunchUIQA {
  func testDiscoverSettingsForMotion() throws {
    continueAfterFailure = false
    let settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
    settings.activate()
    XCTAssertTrue(settings.wait(for: .runningForeground, timeout: 10))
    XCTAssertTrue(settings.navigationBars.firstMatch.waitForExistence(timeout: 10))
    capture(settings, "43-motion-native-settings-discovery", checkStatusBar: false)
    print("TIH_NATIVE_UIKIT_MOTION_DISCOVERY \(UIAccessibility.isReduceMotionEnabled)")
  }
}


extension LaunchUIQA {
  /// Scroll only the existing app body; footer controls are checked separately.
  func requireBodyElementFullyVisible(_ element: XCUIElement, in app: XCUIApplication) {
    func ownerScroll() -> XCUIElement {
      if element.exists {
        let owner = app.scrollViews.containing(NSPredicate(format: "label == %@", element.label)).firstMatch
        if owner.exists { return owner }
      }
      return app.scrollViews.allElementsBoundByIndex.last ?? app.scrollViews.firstMatch
    }
    for _ in 0..<30 {
      let scroll = ownerScroll()
      let viewport = scroll.exists ? scroll.frame.intersection(app.frame) : app.frame
      if element.exists && element.isHittable && viewport.contains(element.frame) {
        // React's new card can precede completion of the native stack transition.
        Thread.sleep(forTimeInterval: 0.4)
        let settled = ownerScroll()
        if element.isHittable && (!settled.exists || settled.frame.contains(element.frame)) { break }
        continue
      }
      guard scroll.exists else { break }
      let distance: CGFloat
      if element.exists {
        let needed = element.frame.minY < viewport.minY
          ? viewport.minY - element.frame.minY + 12
          : viewport.maxY - element.frame.maxY - 12
        distance = max(-viewport.height * 0.7, min(viewport.height * 0.7, needed))
      } else { distance = -viewport.height * 0.7 }
      let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: app.datePickers.firstMatch.exists ? 0.07 : 0.4, dy: distance < 0 ? 0.85 : 0.15))
      start.press(forDuration: 0.05, thenDragTo: start.withOffset(CGVector(dx: 0, dy: distance)), withVelocity: .slow, thenHoldForDuration: 0.1)
    }
    XCTAssertTrue(element.exists)
    XCTAssertTrue(element.isHittable)
    XCTAssertTrue(app.frame.contains(element.frame), "The complete native control must fit the app viewport")
    let scroll = ownerScroll()
    if scroll.exists { XCTAssertTrue(scroll.frame.contains(element.frame), "Control \(element.frame) must fit its owning scroll viewport \(scroll.frame)") }
  }

  func confirmSyntheticDraftDateIfNeeded(in app: XCUIApplication, expectFresh: Bool? = nil) throws {
    let field = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Last known period start:")).firstMatch
    XCTAssertTrue(field.waitForExistence(timeout: 5))
    let unset = field.label.hasSuffix("Not set")
    if let expectFresh = expectFresh {
      XCTAssertEqual(unset, expectFresh, "Only genuine saved data may prefill the existing date step")
    }
    let next = app.buttons["Continue"].firstMatch
    if !unset {
      XCTAssertTrue(next.isEnabled, "A genuine saved date remains usable")
      return
    }
    XCTAssertFalse(next.isEnabled, "A fresh date must not silently default to today")
    capture(app, "06a-date-not-set-continue-disabled")
    requireBodyElementFullyVisible(field, in: app)
    field.tap()
    XCTAssertTrue(app.datePickers.firstMatch.waitForExistence(timeout: 5))
    let cancel = app.buttons["Cancel"].firstMatch
    requireBodyElementFullyVisible(cancel, in: app)
    cancel.tap()
    XCTAssertTrue(field.waitForExistence(timeout: 5))
    XCTAssertTrue(field.label.hasSuffix("Not set"), "Cancelling the native candidate must preserve an empty draft")
    XCTAssertFalse(next.isEnabled)
    requireBodyElementFullyVisible(field, in: app)
    field.tap()
    XCTAssertTrue(app.datePickers.firstMatch.waitForExistence(timeout: 5))
    let done = app.buttons["Done"].firstMatch
    requireBodyElementFullyVisible(done, in: app)
    done.tap() // Explicitly confirms this isolated simulator's synthetic candidate.
    XCTAssertFalse(field.label.hasSuffix("Not set"))
    XCTAssertTrue(next.isEnabled)
  }

  func nativeProcess(in app: XCUIApplication) throws -> String {
    let description = app.debugDescription
    let range = try XCTUnwrap(description.range(of: "pid: [0-9]+", options: .regularExpression))
    return String(description[range])
  }

  func nativePrimaryTab(_ label: String, in app: XCUIApplication) -> XCUIElement {
    let tab = app.otherElements.matching(NSPredicate(format: "label ENDSWITH %@", ", \(label)")).firstMatch
    XCTAssertTrue(tab.waitForExistence(timeout: 5))
    XCTAssertTrue(tab.isHittable)
    XCTAssertTrue(app.frame.contains(tab.frame))
    return tab
  }

  func assertLockedToday(in app: XCUIApplication, timeout: TimeInterval = 5) {
    XCTAssertTrue(app.staticTexts["An active trial or subscription unlocks today’s context."].firstMatch.waitForExistence(timeout: timeout))
    XCTAssertTrue(app.buttons["View subscription"].exists)
    XCTAssertFalse(app.staticTexts["KEEP IN MIND"].firstMatch.exists, "Home must not create protected access")
  }

  /// Requires the existing English, saved-28/5, no-access synthetic fixture and native RM OFF.
  func testHomeSingleAndDoubleTapStaysLockedSameProcess() throws {
    continueAfterFailure = false
    XCTAssertFalse(UIAccessibility.isReduceMotionEnabled, "Full-motion timing requires the isolated simulator's Reduce Motion OFF")
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    XCTAssertNotEqual(app.state, .notRunning)
    clearExistingOpenConfirmation(for: app)
    app.activate()
    assertLockedToday(in: app)
    let process = try nativeProcess(in: app)
    for doubleTap in [false, true] {
      nativePrimaryTab("Settings", in: app).tap()
      XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Cycle details")).firstMatch.waitForExistence(timeout: 5))
      let home = app.buttons["brand-home"].firstMatch
      XCTAssertTrue(home.waitForExistence(timeout: 5))
      XCTAssertTrue(home.isHittable)
      let started = ProcessInfo.processInfo.systemUptime
      if doubleTap { home.doubleTap() } else { home.tap() }
      let cover = app.otherElements["home-transition"].firstMatch
      XCTAssertTrue(cover.waitForExistence(timeout: 2), "The explicit Home gesture must show the shared intro cover")
      capture(app, doubleTap ? "47-home-double-tap-one-cover" : "45-home-single-tap-cover")
      let gone = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: cover)
      XCTAssertEqual(XCTWaiter.wait(for: [gone], timeout: 17), .completed)
      let duration = ProcessInfo.processInfo.systemUptime - started
      print("TIH_HOME_GESTURE double=\(doubleTap) seconds=\(duration)")
      XCTAssertGreaterThanOrEqual(duration, 8.5, "Full-motion Home must retain the existing nine-second choreography")
      XCTAssertLessThan(duration, 17.5, "A double tap must not queue two consecutive full intros")
      assertLockedToday(in: app)
      XCTAssertEqual(try nativeProcess(in: app), process, "Home must not restart the application")
      capture(app, doubleTap ? "48-home-double-tap-returned-locked-today" : "46-home-single-tap-returned-locked-today")
    }
  }

  /// Opens/cancels the existing editor only. Does not choose a date, change a length or Save.
  func testCalendarFixedUpdateOpensSavedEditorWithoutWrites() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    XCTAssertNotEqual(app.state, .notRunning)
    clearExistingOpenConfirmation(for: app)
    app.activate()
    assertLockedToday(in: app)
    let process = try nativeProcess(in: app)
    nativePrimaryTab("Cycle", in: app).tap()
    let editQuery = app.buttons.matching(NSPredicate(format: "label == %@", "Edit cycle details"))
    let edit = editQuery.firstMatch
    XCTAssertTrue(edit.waitForExistence(timeout: 5))
    XCTAssertEqual(editQuery.count, 1, "Reuse one calendar update action")
    let originalFrame = edit.frame
    func requireFixedUpdate() {
      XCTAssertTrue(edit.isHittable)
      XCTAssertTrue(app.frame.contains(edit.frame))
      XCTAssertGreaterThanOrEqual(edit.frame.minY, app.scrollViews.firstMatch.frame.maxY - 1)
      let tabs = ["Advice", "Cycle", "Settings"].map { nativePrimaryTab($0, in: app) }
      XCTAssertLessThanOrEqual(edit.frame.maxY, tabs.map { $0.frame.minY }.min()! + 1, "Update must stay above the existing primary navigation")
      XCTAssertEqual(edit.frame.minY, originalFrame.minY, accuracy: 1)
    }
    requireFixedUpdate()
    capture(app, "49-calendar-update-fixed-above-tabs")
    app.scrollViews.firstMatch.swipeUp(velocity: .slow)
    requireFixedUpdate()
    capture(app, "50-calendar-update-still-fixed-after-scroll")
    edit.tap()
    let field = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Last known period start:")).firstMatch
    XCTAssertTrue(field.waitForExistence(timeout: 5))
    let savedLabel = field.label
    XCTAssertFalse(savedLabel.hasSuffix("Not set"), "The existing saved cycle must prefill the existing editor")
    XCTAssertTrue(app.staticTexts["28 days"].firstMatch.exists)
    XCTAssertTrue(app.staticTexts["5 days"].firstMatch.exists)
    XCTAssertTrue(app.buttons["Save"].firstMatch.isEnabled)
    capture(app, "51-calendar-existing-saved-editor-no-save")
    app.buttons["Back"].firstMatch.tap()
    XCTAssertTrue(edit.waitForExistence(timeout: 5))
    edit.tap()
    XCTAssertTrue(field.waitForExistence(timeout: 5))
    XCTAssertEqual(field.label, savedLabel, "Cancelling and reopening must retain the genuine saved date")
    app.buttons["Back"].firstMatch.tap()
    nativePrimaryTab("Advice", in: app).tap()
    assertLockedToday(in: app)
    XCTAssertEqual(try nativeProcess(in: app), process)
  }

  /// Reads the existing documents. No external URL, billing or destructive row is tapped.
  func testLongDocumentsFixedSecondaryControlsNoWrites() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    XCTAssertNotEqual(app.state, .notRunning)
    clearExistingOpenConfirmation(for: app)
    app.activate()
    assertLockedToday(in: app)
    let process = try nativeProcess(in: app)
    nativePrimaryTab("Settings", in: app).tap()
    capture(app, "52a-settings-before-documents")
    let cycleDetails = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Cycle details")).firstMatch
    XCTAssertTrue(cycleDetails.waitForExistence(timeout: 5))
    for (title, lastPrefix, useSettings) in [
      ("Privacy", "Remove cycle details, preferences and cue history", false),
      ("Subscription terms", "- Lizenz / Licence -", true),
    ] {
      let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", title)).firstMatch
      requireBodyElementFullyVisible(row, in: app)
      row.tap()
      XCTAssertTrue(app.staticTexts[title].firstMatch.waitForExistence(timeout: 5))
      let backQuery = app.buttons.matching(identifier: "secondary-back")
      let settingsQuery = app.buttons.matching(identifier: "secondary-settings")
      let back = backQuery.firstMatch
      let settings = settingsQuery.firstMatch
      let initialFrame = back.frame
      func requireFixedSecondary() {
        XCTAssertEqual(backQuery.count, 1, "There must be one shared secondary Back control")
        XCTAssertEqual(settingsQuery.count, 1, "There must be one shared secondary Settings control")
        for control in [back, settings] {
          XCTAssertTrue(control.isHittable)
          XCTAssertTrue(app.frame.contains(control.frame))
          XCTAssertGreaterThanOrEqual(control.frame.minY, app.scrollViews.firstMatch.frame.maxY - 1)
        }
        XCTAssertEqual(back.frame.minY, initialFrame.minY, accuracy: 1)
        XCTAssertLessThan(back.frame.minX, settings.frame.minX, "At default text size Back stays left and Settings stays right")
      }
      requireFixedSecondary()
      capture(app, title == "Privacy" ? "52-privacy-fixed-controls-at-start" : "54-terms-fixed-controls-at-start")
      let last = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", lastPrefix)).firstMatch
      let scroll = app.scrollViews.firstMatch
      for _ in 0..<30 {
        if last.exists && last.frame.maxY <= scroll.frame.maxY + 1 { break }
        scroll.swipeUp(velocity: .fast)
      }
      XCTAssertTrue(last.exists)
      XCTAssertLessThanOrEqual(last.frame.maxY, scroll.frame.maxY + 1, "Reach the document's actual final text, rather than claiming a partial scroll reached the bottom")
      requireFixedSecondary()
      capture(app, title == "Privacy" ? "53-privacy-fixed-controls-at-end" : "55-terms-fixed-controls-at-end")
      if useSettings { settings.tap() } else { back.tap() }
      capture(app, useSettings ? "55a-after-secondary-settings" : "53a-after-secondary-back")
      // A real Back retains Settings' prior scroll position; reveal its upper row.
      requireBodyElementFullyVisible(cycleDetails, in: app)
      XCTAssertTrue(cycleDetails.exists, "Back must return to its real previous Settings page; Settings must open the existing Settings screen")
    }
    nativePrimaryTab("Advice", in: app).tap()
    assertLockedToday(in: app)
    XCTAssertEqual(try nativeProcess(in: app), process)
  }
}


extension LaunchUIQA {
  /// Persists only the existing QA theme preference, deliberately cold-launches once,
  /// and restores Light through the same native Appearance controls before returning.
  func testDarkThemePersistsAcrossHomeAndColdLaunchThenRestoreLight() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    XCTAssertNotEqual(app.state, .notRunning)
    clearExistingOpenConfirmation(for: app)
    app.activate()
    assertLockedToday(in: app)
    let originalProcess = try nativeProcess(in: app)
    func appearanceFromLockedToday() {
      nativePrimaryTab("Settings", in: app).tap()
      let appearance = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Appearance")).firstMatch
      requireBodyElementFullyVisible(appearance, in: app)
      appearance.tap()
      XCTAssertTrue(app.staticTexts["Appearance"].firstMatch.waitForExistence(timeout: 5))
    }
    func selectTheme(_ name: String) {
      let option = app.descendants(matching: .any).matching(NSPredicate(format: "label ENDSWITH %@", name)).firstMatch
      requireBodyElementFullyVisible(option, in: app)
      option.tap()
      let saved = NSPredicate(format: "enabled == true AND label CONTAINS %@", "●")
      XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: saved, object: option)], timeout: 5), .completed)
    }
    func requireDarkPixels(_ name: String) throws {
      capture(app, name)
      let image = try XCTUnwrap(app.screenshot().image.cgImage)
      let pixels = try XCTUnwrap(statusBarReadability(in: image))
      XCTAssertTrue(pixels.darkBackground, "This capture must actually show the persisted Graphite appearance")
      XCTAssertGreaterThan(pixels.whiteClockPixels, 80, "Dark Home and entry need a white readable system clock")
    }
    appearanceFromLockedToday()
    selectTheme("Dark")
    try requireDarkPixels("56-dark-theme-saved-before-home")
    let back = app.buttons["secondary-back"].firstMatch
    XCTAssertTrue(back.isHittable)
    back.tap()
    let home = app.buttons["brand-home"].firstMatch
    requireBodyElementFullyVisible(home, in: app)
    home.tap()
    let cover = app.otherElements["home-transition"].firstMatch
    XCTAssertTrue(cover.waitForExistence(timeout: 2))
    try requireDarkPixels("57-dark-home-cover-white-clock")
    let gone = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: cover)
    XCTAssertEqual(XCTWaiter.wait(for: [gone], timeout: 17), .completed)
    assertLockedToday(in: app)
    XCTAssertEqual(try nativeProcess(in: app), originalProcess, "Home preserves the running process")
    try requireDarkPixels("58-dark-theme-preserved-after-home")
    app.terminate() // Intentional cold restart, unlike the preceding Home assertion.
    app.launch()
    assertLockedToday(in: app, timeout: 30)
    try requireDarkPixels("59-dark-theme-persisted-after-cold-launch")
    appearanceFromLockedToday()
    let dark = app.descendants(matching: .any).matching(NSPredicate(format: "label ENDSWITH %@", "Dark")).firstMatch
    XCTAssertTrue(dark.label.contains("●"), "Cold startup must retain the saved theme radio state")
    selectTheme("Light")
    capture(app, "60-light-theme-restored-after-dark-cold-test")
    let lightImage = try XCTUnwrap(app.screenshot().image.cgImage)
    XCTAssertFalse(try XCTUnwrap(statusBarReadability(in: lightImage)).darkBackground)
    app.buttons["secondary-settings"].firstMatch.tap()
    nativePrimaryTab("Advice", in: app).tap()
    assertLockedToday(in: app)
    capture(app, "61-light-locked-today-restored-no-billing")
  }

  /// DESTRUCTIVE TO SYNTHETIC QA CONTENT ONLY. Explicitly authorized for the one
  /// guarded SE3 fixture; never invokes simctl erase, a store action or trial start.
  func testExplicitlyDeleteOwnedSyntheticFixtureThenFreshCycleOnboardingNoBilling() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    XCTAssertNotEqual(app.state, .notRunning, "Requires the already running owned synthetic fixture")
    let pending = app.alerts.firstMatch
    if pending.exists && pending.buttons["Delete data"].exists && pending.buttons["Cancel"].exists { pending.buttons["Cancel"].tap() }
    clearExistingOpenConfirmation(for: app)
    app.activate()
    let advice = app.otherElements.matching(NSPredicate(format: "label ENDSWITH %@", ", Advice")).firstMatch
    if advice.exists && advice.isHittable { advice.tap() }
    assertLockedToday(in: app)
    let process = try nativeProcess(in: app)
    nativePrimaryTab("Cycle", in: app).tap()
    let edit = app.buttons["Edit cycle details"].firstMatch
    XCTAssertTrue(edit.waitForExistence(timeout: 5))
    edit.tap()
    let date = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Last known period start:")).firstMatch
    XCTAssertTrue(date.waitForExistence(timeout: 5))
    XCTAssertFalse(date.label.hasSuffix("Not set"), "Verify the parent-provided existing synthetic setup before its explicit deletion")
    XCTAssertTrue(app.staticTexts["28 days"].firstMatch.exists)
    XCTAssertTrue(app.staticTexts["5 days"].firstMatch.exists)
    capture(app, "62-owned-synthetic-fixture-before-explicit-delete")
    app.buttons["Back"].firstMatch.tap()
    nativePrimaryTab("Settings", in: app).tap()
    let delete = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Delete local data")).firstMatch
    requireBodyElementFullyVisible(delete, in: app)
    print("TIH_EXPLICIT_SYNTHETIC_DELETE simulator=32C5B1E9-BE95-4BC1-8B76-4CE7D2A9979B bundle=com.eliogenesis.tuneintoher")
    delete.tap()
    let confirmation = app.alerts.firstMatch
    XCTAssertTrue(confirmation.waitForExistence(timeout: 5))
    XCTAssertTrue(confirmation.staticTexts.matching(NSPredicate(format: "label == %@", "Remove cycle details, preferences and cue history from this device? This does not cancel your subscription or delete store transaction records. Manage your subscription separately.")).firstMatch.exists)
    XCTAssertTrue(confirmation.buttons["Cancel"].exists)
    XCTAssertTrue(confirmation.buttons["Delete data"].exists)
    confirmation.buttons["Delete data"].tap() // Existing app action; isolated synthetic data only.
    XCTAssertTrue(app.buttons["Select English"].waitForExistence(timeout: 15))
    XCTAssertEqual(try nativeProcess(in: app), process, "Content reset must not restart the app")
    capture(app, "63-explicit-reset-returned-fresh-onboarding")
    try completeOnboardingAssertions(in: app, expectFreshDate: true)
    XCTAssertEqual(try nativeProcess(in: app), process)
    XCTAssertFalse(app.staticTexts["KEEP IN MIND"].firstMatch.exists)
    capture(app, "64-explicit-fresh-cycle-flow-ended-locked-paywall-no-trial")
    let home = app.buttons["brand-home"].firstMatch
    requireBodyElementFullyVisible(home, in: app)
    home.tap()
    let cover = app.otherElements["home-transition"].firstMatch
    XCTAssertTrue(cover.waitForExistence(timeout: 2))
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: cover)], timeout: 17), .completed)
    assertLockedToday(in: app)
  }
}


extension LaunchUIQA {
  // These helpers require the development-only panel before selecting any fixture.
  // Financial controls below are touched only after an explicit active mock scenario.
  func internalQAApp() throws -> XCUIApplication {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    clearExistingOpenConfirmation(for: app)
    app.activate()
    XCTAssertTrue(app.wait(for: .runningForeground, timeout: 30))
    let devIntro = app.staticTexts["This is the developer menu. It gives you access to useful tools in development builds."].firstMatch
    if devIntro.waitForExistence(timeout: 2) {
      // Match the observed Expo tutorial paragraph before touching its Continue;
      // this is never the product onboarding's similarly named control.
      capture(app, "86-qa-expo-developer-menu-tutorial-before", checkStatusBar: false)
      let menuContinue = app.buttons["Continue"].firstMatch
      let scrolls = app.scrollViews
      XCTAssertGreaterThan(scrolls.count, 0)
      let nativeTutorialScroll = scrolls.element(boundBy: scrolls.count - 1)
      for _ in 0..<12 {
        if menuContinue.exists && menuContinue.isHittable && app.frame.contains(menuContinue.frame) { break }
        nativeTutorialScroll.swipeUp(velocity: .slow)
      }
      XCTAssertTrue(menuContinue.isHittable)
      XCTAssertTrue(app.frame.contains(menuContinue.frame))
      menuContinue.tap()
      let close = app.buttons.matching(NSPredicate(format: "identifier == %@ AND label == %@", "xmark", "Close")).firstMatch
      XCTAssertTrue(close.waitForExistence(timeout: 5))
      close.tap()
      capture(app, "87-qa-expo-developer-menu-closed", checkStatusBar: false)
    }
    let existingQA = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Internal QA")).firstMatch
    if existingQA.exists && existingQA.isHittable { existingQA.tap() }
    else if app.buttons["View subscription"].firstMatch.exists || app.buttons["secondary-settings"].firstMatch.exists || app.buttons["Open settings"].firstMatch.exists {
      internalQAReturnToPanel(in: app)
    }
    XCTAssertTrue(app.buttons["qa-scenario-fresh"].firstMatch.waitForExistence(timeout: 30), "Requires the flag-enabled Debug project, not a Release/real billing screen")
    requireBodyElementFullyVisible(app.buttons["qa-scenario-fresh"].firstMatch, in: app)
    XCTAssertTrue(app.staticTexts["DEVELOPMENT MOCK BILLING"].firstMatch.exists)
    return app
  }
  func internalQATap(_ identifier: String, in app: XCUIApplication) {
    let button = app.buttons[identifier].firstMatch
    requireBodyElementFullyVisible(button, in: app)
    let enabled = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: button)
    XCTAssertEqual(XCTWaiter.wait(for: [enabled], timeout: 5), .completed)
    button.tap()
  }
  func internalQAStart(_ scenario: String, in app: XCUIApplication) {
    internalQATap("qa-scenario-\(scenario)", in: app)
    let active = app.staticTexts["Active: \(scenario)"].firstMatch
    XCTAssertTrue(active.waitForExistence(timeout: 5))
    requireBodyElementFullyVisible(active, in: app)
    XCTAssertTrue(app.staticTexts["DEVELOPMENT MOCK BILLING"].firstMatch.exists)
  }
  func internalQAOpen(_ route: String, in app: XCUIApplication) {
    internalQATap("qa-open-" + route.replacingOccurrences(of: "/", with: "-"), in: app)
  }
  func internalQAReturnToPanel(in app: XCUIApplication) {
    let secondary = app.buttons["secondary-settings"].firstMatch
    let todaySettings = app.buttons["Open settings"].firstMatch
    if secondary.exists { secondary.tap() }
    else if todaySettings.exists { todaySettings.tap() }
    else { nativePrimaryTab("Settings", in: app).tap() }
    let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Internal QA")).firstMatch
    if !row.waitForExistence(timeout: 5) { capture(app, "90-qa-settings-navigation-did-not-arrive") }
    XCTAssertTrue(row.exists, "A single Settings tap must reach the existing Settings screen")
    requireBodyElementFullyVisible(row, in: app)
    row.tap()
    XCTAssertTrue(app.buttons["qa-scenario-fresh"].firstMatch.waitForExistence(timeout: 5))
  }
  func internalQAMind(in app: XCUIApplication, day: Int) -> XCUIElement {
    XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label ENDSWITH %@", "DAY \(day)")).firstMatch.waitForExistence(timeout: 15))
    let mind = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "KEEP IN MIND.")).firstMatch
    XCTAssertTrue(mind.waitForExistence(timeout: 15), "Expected actual authored guidance in the mock session")
    requireBodyElementFullyVisible(mind, in: app)
    XCTAssertTrue(app.staticTexts["DEVELOPMENT MOCK BILLING"].firstMatch.exists)
    return mind
  }
  func internalQARequireLocked(in app: XCUIApplication) {
    assertLockedToday(in: app, timeout: 15)
    XCTAssertTrue(app.staticTexts["DEVELOPMENT MOCK BILLING"].firstMatch.exists)
    XCTAssertFalse(app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "KEEP IN MIND.")).firstMatch.exists)
  }
  func internalQAEndAndVerifyOwnedBase(in app: XCUIApplication, process: String, captureName: String) throws {
    internalQATap("qa-end", in: app)
    let reminder = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Daily reminder")).firstMatch
    requireBodyElementFullyVisible(reminder, in: app)
    XCTAssertTrue(reminder.label.contains("Disabled"))
    let appearance = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Appearance")).firstMatch
    requireBodyElementFullyVisible(appearance, in: app)
    XCTAssertTrue(appearance.label.contains("Light"))
    let english = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "English")).firstMatch
    requireBodyElementFullyVisible(english, in: app)
    nativePrimaryTab("Cycle", in: app).tap()
    let edit = app.buttons["Edit cycle details"].firstMatch
    XCTAssertTrue(edit.waitForExistence(timeout: 5))
    edit.tap()
    let date = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Last known period start:")).firstMatch
    XCTAssertTrue(date.waitForExistence(timeout: 5))
    XCTAssertEqual(date.label, "Last known period start: November 14, 2026", "QA must preserve the exact existing synthetic base date")
    XCTAssertTrue(app.staticTexts["28 days"].firstMatch.exists)
    XCTAssertTrue(app.staticTexts["5 days"].firstMatch.exists)
    XCTAssertFalse(app.staticTexts["DEVELOPMENT MOCK BILLING"].firstMatch.exists)
    capture(app, captureName + "-base-saved-details")
    app.buttons["Back"].firstMatch.tap()
    nativePrimaryTab("Advice", in: app).tap()
    assertLockedToday(in: app, timeout: 15)
    XCTAssertFalse(app.staticTexts["DEVELOPMENT MOCK BILLING"].firstMatch.exists, "Ending QA must not leave a mocked access label on real Today")
    XCTAssertFalse(app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "KEEP IN MIND.")).firstMatch.exists)
    XCTAssertEqual(try nativeProcess(in: app), process)
    capture(app, captureName + "-base-locked-today")
  }

  /// Requires the initial flag-enabled Debug dev-qa screen; never changes base data.
  func testInternalQAFreshAndFiveConfirmedCycleDays() throws {
    let app = try internalQAApp(), process = try nativeProcess(in: app)
    internalQAStart("fresh", in: app)
    internalQAOpen("/today", in: app)
    XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "Last known period start: Not set")).firstMatch.waitForExistence(timeout: 10))
    XCTAssertFalse(app.staticTexts.matching(NSPredicate(format: "label MATCHES %@", ".*DAY [0-9]+.*")).firstMatch.exists)
    XCTAssertFalse(app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "KEEP IN MIND.")).firstMatch.exists)
    XCTAssertTrue(app.staticTexts["DEVELOPMENT MOCK BILLING"].firstMatch.exists)
    capture(app, "65-qa-fresh-today-no-date-day-or-phase")
    internalQAReturnToPanel(in: app)
    for day in [1, 7, 14, 21, 28] {
      internalQAStart("cycle-\(day)", in: app)
      internalQAOpen("/today", in: app)
      _ = internalQAMind(in: app, day: day)
      capture(app, "66-qa-confirmed-november3-cycle-day-\(day)")
      if day == 14 {
        let before = internalQAMind(in: app, day: day).label
        let home = app.buttons["brand-home"].firstMatch
        requireBodyElementFullyVisible(home, in: app)
        home.tap()
        let cover = app.otherElements["home-transition"].firstMatch
        XCTAssertTrue(cover.waitForExistence(timeout: 2))
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: cover)], timeout: 17), .completed)
        XCTAssertEqual(internalQAMind(in: app, day: day).label, before)
        capture(app, "66a-qa-protected-today-home-keeps-guidance")
      }
      internalQAReturnToPanel(in: app)
    }
    try internalQAEndAndVerifyOwnedBase(in: app, process: process, captureName: "67-qa-cycle-scenarios-ended")
  }

  func testInternalQA0800BoundaryChangesAdviceAndHistoryNotLocalCycleDay() throws {
    let app = try internalQAApp(), process = try nativeProcess(in: app)
    internalQAStart("before-0800", in: app)
    internalQAOpen("/today", in: app)
    let before = internalQAMind(in: app, day: 8).label
    capture(app, "68-qa-0759-local-day8-prior-guidance")
    internalQAReturnToPanel(in: app)
    internalQATap("qa-next-0800", in: app)
    internalQAOpen("/today", in: app)
    let after = internalQAMind(in: app, day: 8).label
    XCTAssertNotEqual(after, before, "The real daily selector must refresh the authored guidance at synthetic local08:00")
    capture(app, "69-qa-0800-still-local-day8-new-guidance")
    internalQAReturnToPanel(in: app)
    internalQAOpen("/history", in: app)
    for date in ["2026-11-10", "2026-11-09"] {
      let entry = app.staticTexts[date].firstMatch
      requireBodyElementFullyVisible(entry, in: app)
      capture(app, "70-qa-history-real-guidance-key-\(date)")
    }
    internalQAReturnToPanel(in: app)
    try internalQAEndAndVerifyOwnedBase(in: app, process: process, captureName: "71-qa-0800-ended")
  }

  /// Includes a real tap of the existing app-trial CTA, but ONLY within its private mock service.
  func testInternalQAAppTrialFixturesExplicitCardFreeStartAndExactExpiry() throws {
    let app = try internalQAApp(), process = try nativeProcess(in: app)
    for (scenario, active) in [("trial-begin", true), ("trial-middle", true), ("trial-expired", false)] {
      internalQAStart(scenario, in: app)
      internalQAOpen("/today", in: app)
      if active { _ = internalQAMind(in: app, day: 7) } else { internalQARequireLocked(in: app) }
      capture(app, "72-qa-\(scenario)-today")
      internalQAReturnToPanel(in: app)
    }
    internalQAStart("trial-not-started", in: app)
    XCTAssertTrue(app.staticTexts["App access: not_started · Store access: inactive"].firstMatch.exists)
    internalQAOpen("/settings/subscription", in: app)
    XCTAssertTrue(app.staticTexts["DEVELOPMENT MOCK BILLING"].firstMatch.waitForExistence(timeout: 5))
    let start = app.buttons["billing-start-trial"].firstMatch
    requireBodyElementFullyVisible(start, in: app)
    XCTAssertTrue(start.isEnabled)
    capture(app, "73-qa-explicit-card-free-start-before-tap")
    start.tap() // Private AppTrialService fixture; no store purchase/subscription action.
    _ = internalQAMind(in: app, day: 7)
    capture(app, "74-qa-explicit-card-free-start-unlocked")
    internalQAReturnToPanel(in: app)
    let granted = app.staticTexts["App access: active · Store access: inactive"].firstMatch
    requireBodyElementFullyVisible(granted, in: app)
    internalQATap("qa-expiry", in: app)
    let expired = app.staticTexts["App access: expired · Store access: inactive"].firstMatch
    requireBodyElementFullyVisible(expired, in: app)
    capture(app, "75-qa-exact-app-access-expiry-no-store-subscription")
    internalQAOpen("/today", in: app)
    internalQARequireLocked(in: app)
    capture(app, "76-qa-exact-expiry-locked-no-automatic-charge")
    internalQAReturnToPanel(in: app)
    try internalQAEndAndVerifyOwnedBase(in: app, process: process, captureName: "77-qa-app-trial-ended")
  }

  func testInternalQAPaidActiveCancelledAndExpiredFixtures() throws {
    let app = try internalQAApp(), process = try nativeProcess(in: app)
    for (scenario, active) in [("paid-active", true), ("paid-cancelled", true), ("paid-expired", false)] {
      internalQAStart(scenario, in: app)
      internalQAOpen("/today", in: app)
      if active { _ = internalQAMind(in: app, day: 7) } else { internalQARequireLocked(in: app) }
      capture(app, "78-qa-\(scenario)-today")
      internalQAReturnToPanel(in: app)
      internalQAOpen("/settings/subscription", in: app)
      XCTAssertTrue(app.staticTexts["DEVELOPMENT MOCK BILLING"].firstMatch.waitForExistence(timeout: 5))
      let status = scenario == "paid-active"
        ? app.staticTexts["Active subscription"].firstMatch
        : scenario == "paid-cancelled"
          ? app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Active until ")).firstMatch
          : app.staticTexts["Your 14 free days have ended. Your saved data remains available."].firstMatch
      requireBodyElementFullyVisible(status, in: app)
      XCTAssertEqual(app.buttons["Manage subscription"].exists, active)
      capture(app, "79-qa-\(scenario)-subscription-status")
      internalQAReturnToPanel(in: app)
    }
    try internalQAEndAndVerifyOwnedBase(in: app, process: process, captureName: "80-qa-paid-fixtures-ended")
  }

  /// RUN FIRST from the initial Debug dev-qa stack (before an existing Settings route).
  /// The THEA detour retains the failed card while the private mock store is recovered.
  func testInternalQAStoreRetryAndMockRestoreNoRealBilling() throws {
    let app = try internalQAApp(), process = try nativeProcess(in: app)
    internalQAStart("store-unavailable", in: app)
    internalQAOpen("/settings/subscription", in: app)
    let unavailable = app.staticTexts["The store offer could not be loaded. No price or trial has been assumed."].firstMatch
    requireBodyElementFullyVisible(unavailable, in: app)
    let retry = app.buttons["billing-retry"].firstMatch
    requireBodyElementFullyVisible(retry, in: app)
    XCTAssertTrue(retry.isEnabled)
    XCTAssertTrue(app.staticTexts["DEVELOPMENT MOCK BILLING"].firstMatch.exists)
    capture(app, "81-qa-mock-store-unavailable-retry-visible")
    let thea = app.buttons["About THEA"].firstMatch
    requireBodyElementFullyVisible(thea, in: app)
    thea.tap()
    let settings = app.buttons["secondary-settings"].firstMatch
    XCTAssertTrue(settings.waitForExistence(timeout: 5))
    settings.tap() // No prior Settings route: replaces THEA, retaining Subscription below it.
    let qaRow = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Internal QA")).firstMatch
    requireBodyElementFullyVisible(qaRow, in: app)
    qaRow.tap()
    XCTAssertTrue(app.staticTexts["Active: store-unavailable"].firstMatch.waitForExistence(timeout: 5))
    internalQATap("qa-store-online", in: app)
    for _ in 0..<2 {
      let back = app.buttons["Back"].firstMatch
      requireBodyElementFullyVisible(back, in: app)
      back.tap()
    }
    XCTAssertTrue(unavailable.waitForExistence(timeout: 5), "Return to the same failed card, not a remounted successful offering")
    requireBodyElementFullyVisible(retry, in: app)
    XCTAssertTrue(app.staticTexts["DEVELOPMENT MOCK BILLING"].firstMatch.exists)
    retry.tap() // Existing Retry; selects only MockPurchaseService in this active session.
    let price = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", "€3.99")).firstMatch
    requireBodyElementFullyVisible(price, in: app)
    XCTAssertFalse(retry.exists)
    capture(app, "82-qa-existing-retry-recovered-mock-offerings")
    internalQAReturnToPanel(in: app)
    internalQAStart("restore", in: app)
    XCTAssertTrue(app.staticTexts["App access: expired · Store access: inactive"].firstMatch.exists)
    internalQAOpen("/settings/subscription", in: app)
    XCTAssertTrue(app.staticTexts["DEVELOPMENT MOCK BILLING"].firstMatch.waitForExistence(timeout: 5))
    let restore = app.buttons["billing-restore"].firstMatch
    requireBodyElementFullyVisible(restore, in: app)
    restore.tap() // Explicit fixture Restore, never the real base service.
    XCTAssertTrue(app.alerts.staticTexts["Purchases restored."].firstMatch.waitForExistence(timeout: 5))
    app.alerts.buttons["OK"].firstMatch.tap()
    XCTAssertTrue(app.staticTexts["Active subscription"].firstMatch.waitForExistence(timeout: 5))
    capture(app, "83-qa-explicit-mock-restore-active-subscription")
    internalQAReturnToPanel(in: app)
    internalQAOpen("/today", in: app)
    _ = internalQAMind(in: app, day: 7)
    capture(app, "84-qa-mock-restore-unlocked-guidance")
    internalQAReturnToPanel(in: app)
    try internalQAEndAndVerifyOwnedBase(in: app, process: process, captureName: "85-qa-store-restore-ended")
  }
}

extension LaunchUIQA {
  func testReducedMotionHomeReturnsFromPrivacyWithoutFullScene() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    let settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
    settings.activate()
    let reduce = openMotionSettings(in: settings)
    XCTAssertTrue(reduce.waitForExistence(timeout: 5))
    XCTAssertEqual(reduce.value as? String, "0", "Owned fixture must begin with the previously restored Reduce Motion OFF")
    let control = reduce.descendants(matching: .switch).firstMatch
    XCTAssertTrue(control.exists)
    control.tap()
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", "1"), object: reduce)], timeout: 5), .completed)
    XCTAssertTrue(UIAccessibility.isReduceMotionEnabled)
    defer {
      settings.activate()
      if reduce.value as? String != "0" { reduce.descendants(matching: .switch).firstMatch.tap() }
      XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", "0"), object: reduce)], timeout: 5), .completed)
      XCTAssertFalse(UIAccessibility.isReduceMotionEnabled)
      app.activate()
    }
    app.activate()
    assertLockedToday(in: app, timeout: 30)
    let process = try nativeProcess(in: app)
    nativePrimaryTab("Settings", in: app).tap()
    let privacy = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Privacy")).firstMatch
    requireBodyElementFullyVisible(privacy, in: app)
    privacy.tap()
    XCTAssertTrue(app.buttons["secondary-back"].firstMatch.waitForExistence(timeout: 5))
    let home = app.buttons["brand-home"].firstMatch
    requireBodyElementFullyVisible(home, in: app)
    let start = ProcessInfo.processInfo.systemUptime
    home.tap()
    assertLockedToday(in: app, timeout: 4)
    let elapsed = ProcessInfo.processInfo.systemUptime - start
    XCTAssertLessThan(elapsed, 6, "Reduced Motion must skip the full nine-second Home scene")
    XCTAssertEqual(try nativeProcess(in: app), process)
    print("TIH_REDUCED_MOTION_HOME_SECONDS \(elapsed)")
    capture(app, "91-reduced-motion-home-quick-locked-today")
  }
}
