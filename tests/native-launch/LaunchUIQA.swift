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
      print("TIH_STATUS_BAR_PIXELS \(name) background=\(pixels.backgroundRGB) dark=\(pixels.darkBackground) whiteClockPixels=\(pixels.whiteClockPixels) darkClockPixels=\(pixels.darkClockPixels)")
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
    restoreReducedMotionOff(in: XCUIApplication(bundleIdentifier: "com.apple.Preferences"))
  }

  /// Re-query Settings after every app round trip. Reuse the actual inner UISwitch
  /// and bounded thumb drag, preserving both native-value and UIKit OFF assertions.
  func restoreReducedMotionOff(in settings: XCUIApplication) {
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

  /// Native AX hit points can target a decorative child. Verify navigation and
  /// allow one explicit frame-center retry before reporting an application issue.
  func tapNativePrimaryTab(_ label: String, in app: XCUIApplication, expect destination: XCUIElement) {
    let tab = nativePrimaryTab(label, in: app)
    print("TIH_PRIMARY_TAB_BEFORE \(label) frame=\(tab.frame) destinationExists=\(destination.exists)")
    print("TIH_PRIMARY_TAB_AX_BEFORE \(app.debugDescription)")
    capture(app, "tab-\(label.lowercased())-before-native-tap")
    tab.tap()
    if destination.waitForExistence(timeout: 2) { return }
    capture(app, "tab-\(label.lowercased())-semantic-tap-did-not-navigate")
    print("TIH_PRIMARY_TAB_CENTER_RETRY \(label) frame=\(tab.frame)")
    let frame = tab.frame
    app.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(
      dx: frame.midX - app.frame.minX, dy: frame.midY - app.frame.minY
    )).tap()
    XCTAssertTrue(destination.waitForExistence(timeout: 5), "Both native semantic and bounded center taps must reach \(label)")
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
      let settingsRoot = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Cycle details")).firstMatch
      tapNativePrimaryTab("Settings", in: app, expect: settingsRoot)
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
      XCTAssertGreaterThanOrEqual(duration, 5.4, "Full-motion Home retains all original depth travel, then one second of assembled V4")
      XCTAssertLessThan(duration, 10.5, "A double tap must not queue two consecutive complete intros")
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
      let settingsRoot = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Cycle details")).firstMatch
      tapNativePrimaryTab("Settings", in: app, expect: settingsRoot)
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
    let initialScreenshot = app.screenshot() // Capture before AX traversal consumes the initial steel interval.
    let initialAttachment = XCTAttachment(screenshot: initialScreenshot)
    initialAttachment.name = "57-v5-steel-home-cover-dark-clock"
    initialAttachment.lifetime = .keepAlways
    add(initialAttachment)
    let initialImage = try XCTUnwrap(initialScreenshot.image.cgImage)
    let initialPixels = try XCTUnwrap(statusBarReadability(in: initialImage))
    print("TIH_STATUS_BAR_PIXELS 57-v5-steel-home-cover-dark-clock background=\(initialPixels.backgroundRGB) whiteClockPixels=\(initialPixels.whiteClockPixels) darkClockPixels=\(initialPixels.darkClockPixels)")
    XCTAssertFalse(initialPixels.darkBackground, "V5 Home starts with the approved steel atmosphere even when Dark is saved")
    XCTAssertTrue(initialPixels.backgroundRGB.allSatisfy { $0 > 80 && $0 < 210 }, "Assert the real steel backdrop, not an unrelated light page")
    XCTAssertGreaterThan(initialPixels.darkClockPixels, 80, "Initial steel atmosphere needs readable dark clock pixels")
    let darkCover = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
      guard cover.exists, let image = app.screenshot().image.cgImage,
        let pixels = statusBarReadability(in: image) else { return false }
      return pixels.darkBackground && pixels.whiteClockPixels > 80
    }, object: app)
    XCTAssertEqual(XCTWaiter.wait(for: [darkCover], timeout: 9), .completed, "The same Home cover must acquire a readable white clock as it blends into saved Dark")
    try requireDarkPixels("57a-v5-home-faded-dark-white-clock")
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
    tapNativePrimaryTab("Advice", in: app, expect: app.staticTexts["An active trial or subscription unlocks today’s context."].firstMatch)
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
      restoreReducedMotionOff(in: settings)
      app.activate()
    }
    app.activate()
    assertLockedToday(in: app, timeout: 30)
    let process = try nativeProcess(in: app)
    let settingsRoot = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Cycle details")).firstMatch
    tapNativePrimaryTab("Settings", in: app, expect: settingsRoot)
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

extension LaunchUIQA {
  /// Requires the explicitly packaged standalone memory-only paid-active fixture.
  /// Does not launch/terminate, save preferences/cycle, transact or end QA into real data.
  func testStandaloneQAActualTodayTextsScrollModalSettingsAndHomeReplay() throws {
    continueAfterFailure = false
    XCTAssertFalse(UIAccessibility.isReduceMotionEnabled, "This case verifies full-motion Home on the owned Simulator")
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    XCTAssertNotEqual(app.state, .notRunning, "Root must first install and cold-record the reviewed standalone QA artifact")
    app.activate()
    let disclosure = app.staticTexts["DEVELOPMENT MOCK BILLING"].firstMatch
    XCTAssertTrue(disclosure.waitForExistence(timeout: 30), "Never run this fixture case against ordinary personal-data Release")
    XCTAssertFalse(app.buttons["qa-scenario-fresh"].exists, "Standalone startup must show actual Today, not the QA panel")
    let process = try nativeProcess(in: app)
    func card(_ title: String) -> XCUIElement {
      let element = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", title + ".")).firstMatch
      XCTAssertTrue(element.waitForExistence(timeout: 15), "Actual authored \(title) guidance must exist")
      requireBodyElementFullyVisible(element, in: app)
      XCTAssertGreaterThan(element.label.count, title.count + 35, "A heading alone is not authored guidance")
      return element
    }
    let mind = card("KEEP IN MIND")
    let originalMind = mind.label
    XCTAssertFalse(app.buttons["View subscription"].exists, "Private mock access must use the ordinary guidance route")
    capture(app, "101-standalone-qa-today-authored-mind")
    let support = card("SUPPORT")
    let originalSupport = support.label
    capture(app, "102-standalone-qa-scrolled-authored-support")
    let action = card("DO")
    let originalAction = action.label
    capture(app, "103-standalone-qa-scrolled-authored-do")

    func openMindAndReturn(_ name: String) {
      let currentMind = card("KEEP IN MIND")
      XCTAssertEqual(currentMind.label, originalMind)
      currentMind.tap()
      let back = app.buttons["Back"].firstMatch
      XCTAssertTrue(back.waitForExistence(timeout: 5), "Native tap must open the existing advice reading modal")
      let authoredTexts = app.staticTexts.allElementsBoundByIndex.filter {
        $0.label.count > 15 && originalMind.contains($0.label)
      }
      XCTAssertGreaterThanOrEqual(authoredTexts.count, 2, "The modal must render both actual guidance text and authored note")
      capture(app, name)
      XCTAssertTrue(back.isHittable)
      back.tap()
      XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label == %@", originalMind)).firstMatch.waitForExistence(timeout: 5))
    }
    openMindAndReturn("104-standalone-qa-native-advice-modal")

    // AnimatedToday has its own existing fixed footer, distinct from generic Screen tabs.
    let settings = app.buttons.matching(NSPredicate(format: "label IN %@", ["Open settings", "Settings"])).firstMatch
    XCTAssertTrue(settings.waitForExistence(timeout: 5))
    XCTAssertTrue(settings.isHittable)
    XCTAssertTrue(app.frame.contains(settings.frame))
    let settingsRoot = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Cycle details")).firstMatch
    settings.tap()
    if !settingsRoot.waitForExistence(timeout: 2) {
      print("TIH_STANDALONE_FOOTER_CENTER_RETRY")
      let frame = settings.frame
      app.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(
        dx: frame.midX - app.frame.minX, dy: frame.midY - app.frame.minY
      )).tap()
    }
    XCTAssertTrue(settingsRoot.waitForExistence(timeout: 5), "Existing Settings navigation must respond after Today")
    capture(app, "105-standalone-qa-existing-settings-no-writes")
    let home = app.buttons["brand-home"].firstMatch
    XCTAssertTrue(home.waitForExistence(timeout: 5))
    XCTAssertTrue(home.isHittable)
    let started = ProcessInfo.processInfo.systemUptime
    home.tap()
    let cover = app.otherElements["home-transition"].firstMatch
    XCTAssertTrue(cover.waitForExistence(timeout: 2))
    capture(app, "106-standalone-qa-home-opening")
    let gone = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: cover)
    XCTAssertEqual(XCTWaiter.wait(for: [gone], timeout: 20), .completed)
    print("TIH_STANDALONE_QA_HOME_TOTAL_SECONDS \(ProcessInfo.processInfo.systemUptime - started)")
    XCTAssertEqual(try nativeProcess(in: app), process, "Home replay must preserve this standalone process")
    XCTAssertEqual(card("KEEP IN MIND").label, originalMind)
    XCTAssertTrue(disclosure.exists)
    capture(app, "107-standalone-qa-home-restored-authored-mind")
    XCTAssertEqual(card("SUPPORT").label, originalSupport)
    XCTAssertEqual(card("DO").label, originalAction)
    capture(app, "108-standalone-qa-home-restored-authored-do")
    openMindAndReturn("109-standalone-qa-post-home-interactive-modal")
    XCTAssertFalse(cover.exists)
    XCTAssertEqual(try nativeProcess(in: app), process)
    print("TIH_STANDALONE_QA_AUTHORED_TEXTS_SCROLL_MODAL_SETTINGS_HOME_SAME_PROCESS_PASS")
  }
}
// FINAL_PASS_20261115_BEGIN
extension LaunchUIQA {
  var finalPassLabels: [String: [String: String]] {
    [
      "en": ["autonym": "English", "advice": "Advice", "cycle": "Cycle", "settings": "Settings", "editCycle": "Edit cycle details", "mind": "KEEP IN MIND", "support": "SUPPORT", "action": "DO", "languageRow": "Language", "languageTitle": "Language", "subscriptionTitle": "Subscription", "privacyTitle": "Privacy", "termsTitle": "Subscription terms", "qaTitle": "Internal testing", "mockDisclosure": "DEVELOPMENT MOCK BILLING", "continue": "Continue", "educationTitle": "Understanding the cycle", "learnMore": "Learn more", "paywallTitle": "One useful cue every day.", "back": "Back", "openSettings": "Open settings", "aboutThea": "About THEA"],
      "it": ["autonym": "Italiano", "advice": "Consigli", "cycle": "Ciclo", "settings": "Impostazioni", "editCycle": "Modifica i dati del ciclo", "mind": "RICORDA", "support": "SOSTIENI", "action": "FAI", "languageRow": "Lingua", "languageTitle": "Lingua", "subscriptionTitle": "Abbonamento", "privacyTitle": "Privacy", "termsTitle": "Condizioni di abbonamento", "qaTitle": "Test interni", "mockDisclosure": "PAGAMENTI SIMULATI DI SVILUPPO", "continue": "Continua", "educationTitle": "Capire il ciclo", "learnMore": "Scopri di più", "paywallTitle": "Un suggerimento utile ogni giorno.", "back": "Indietro", "openSettings": "Apri impostazioni", "aboutThea": "Informazioni su THEA"],
      "es": ["autonym": "Español", "advice": "Consejos", "cycle": "Ciclo", "settings": "Ajustes", "editCycle": "Editar datos del ciclo", "mind": "RECUERDA", "support": "APOYA", "action": "HAZ", "languageRow": "Idioma", "languageTitle": "Idioma", "subscriptionTitle": "Suscripción", "privacyTitle": "Privacidad", "termsTitle": "Condiciones de suscripción", "qaTitle": "Pruebas internas", "mockDisclosure": "PAGO SIMULADO DE DESARROLLO", "continue": "Continuar", "educationTitle": "Comprender el ciclo", "learnMore": "Más información", "paywallTitle": "Una sugerencia útil cada día.", "back": "Atrás", "openSettings": "Abrir ajustes", "aboutThea": "Acerca de THEA"],
      "ru": ["autonym": "Русский", "advice": "Советы", "cycle": "Цикл", "settings": "Настройки", "editCycle": "Изменить данные цикла", "mind": "УЧТИ", "support": "ПОДДЕРЖИ", "action": "СДЕЛАЙ", "languageRow": "Язык", "languageTitle": "Язык", "subscriptionTitle": "Подписка", "privacyTitle": "Конфиденциальность", "termsTitle": "Условия подписки", "qaTitle": "Внутреннее тестирование", "mockDisclosure": "ТЕСТОВАЯ ОПЛАТА ДЛЯ РАЗРАБОТКИ", "continue": "Продолжить", "educationTitle": "Как устроен цикл", "learnMore": "Узнать больше", "paywallTitle": "Одна полезная подсказка каждый день.", "back": "Назад", "openSettings": "Открыть настройки", "aboutThea": "О THEA"],
      "uk": ["autonym": "Українська", "advice": "Поради", "cycle": "Цикл", "settings": "Налаштування", "editCycle": "Змінити дані циклу", "mind": "ВРАХУЙ", "support": "ПІДТРИМАЙ", "action": "ЗРОБИ", "languageRow": "Мова", "languageTitle": "Мова", "subscriptionTitle": "Підписка", "privacyTitle": "Приватність", "termsTitle": "Умови підписки", "qaTitle": "Внутрішнє тестування", "mockDisclosure": "ТЕСТОВА ОПЛАТА ДЛЯ РОЗРОБКИ", "continue": "Продовжити", "educationTitle": "Як влаштований цикл", "learnMore": "Дізнатися більше", "paywallTitle": "Одна корисна підказка щодня.", "back": "Назад", "openSettings": "Відкрити налаштування", "aboutThea": "Про THEA"],
      "fr": ["autonym": "Français", "advice": "Conseils", "cycle": "Cycle", "settings": "Réglages", "editCycle": "Modifier le cycle", "mind": "À RETENIR", "support": "SOUTIENS", "action": "AGIS", "languageRow": "Langue", "languageTitle": "Langue", "subscriptionTitle": "Abonnement", "privacyTitle": "Confidentialité", "termsTitle": "Conditions d’abonnement", "qaTitle": "Tests internes", "mockDisclosure": "PAIEMENT SIMULÉ — DÉVELOPPEMENT", "continue": "Continuer", "educationTitle": "Comprendre le cycle", "learnMore": "En savoir plus", "paywallTitle": "Un conseil utile chaque jour.", "back": "Retour", "openSettings": "Ouvrir les réglages", "aboutThea": "À propos de THEA"],
      "de": ["autonym": "Deutsch", "advice": "Tipps", "cycle": "Zyklus", "settings": "Einstellungen", "editCycle": "Zyklusdaten bearbeiten", "mind": "BEACHTE", "support": "UNTERSTÜTZE", "action": "HANDLE", "languageRow": "Sprache", "languageTitle": "Sprache", "subscriptionTitle": "Abonnement", "privacyTitle": "Datenschutz", "termsTitle": "Abobedingungen", "qaTitle": "Interne Tests", "mockDisclosure": "SIMULIERTE ZAHLUNG — ENTWICKLUNG", "continue": "Weiter", "educationTitle": "Den Zyklus verstehen", "learnMore": "Mehr erfahren", "paywallTitle": "Ein hilfreicher Impuls jeden Tag.", "back": "Zurück", "openSettings": "Einstellungen öffnen", "aboutThea": "Über THEA"],
      "hi": ["autonym": "हिन्दी", "advice": "सुझाव", "cycle": "चक्र", "settings": "सेटिंग्स", "settingsAXTitle": "सेटिंग", "editCycle": "चक्र का विवरण बदलें", "mind": "ध्यान रखें", "support": "सहारा दें", "action": "करें", "languageRow": "भाषा", "languageTitle": "भाषा", "subscriptionTitle": "सदस्यता", "privacyTitle": "निजता", "termsTitle": "सदस्यता की शर्तें", "qaTitle": "आंतरिक परीक्षण", "mockDisclosure": "विकास हेतु नकली भुगतान", "continue": "आगे बढ़ें", "educationTitle": "मासिक चक्र को समझें", "learnMore": "और जानें", "paywallTitle": "हर दिन एक उपयोगी सुझाव।", "back": "वापस", "openSettings": "सेटिंग खोलें", "aboutThea": "THEA के बारे में"],
      "zh-Hans": ["autonym": "简体中文", "advice": "建议", "cycle": "周期", "settings": "设置", "editCycle": "修改周期资料", "mind": "请记住", "support": "支持", "action": "行动", "languageRow": "语言", "languageTitle": "语言", "subscriptionTitle": "订阅", "privacyTitle": "隐私", "termsTitle": "订阅条款", "qaTitle": "内部测试", "mockDisclosure": "开发模拟支付", "continue": "继续", "educationTitle": "了解月经周期", "learnMore": "了解更多", "paywallTitle": "每天一条实用建议。", "back": "返回", "openSettings": "打开设置", "aboutThea": "关于 THEA"],
      "ms": ["autonym": "Bahasa Melayu", "advice": "Nasihat", "cycle": "Kitaran", "settings": "Tetapan", "editCycle": "Edit butiran kitaran", "mind": "INGAT", "support": "SOKONG", "action": "LAKUKAN", "languageRow": "Bahasa", "languageTitle": "Bahasa", "subscriptionTitle": "Langganan", "privacyTitle": "Privasi", "termsTitle": "Terma langganan", "qaTitle": "Ujian dalaman", "mockDisclosure": "BAYARAN SIMULASI PEMBANGUNAN", "continue": "Teruskan", "educationTitle": "Memahami kitaran", "learnMore": "Ketahui lebih lanjut", "paywallTitle": "Satu cadangan berguna setiap hari.", "back": "Kembali", "openSettings": "Buka tetapan", "aboutThea": "Tentang THEA"],
      "mbf": ["autonym": "Baba Melayu · Peranakan", "advice": "Nasihat", "cycle": "Kitaran", "settings": "Tetapan", "editCycle": "Tukar butiran kitaran", "mind": "INGAT", "support": "SOKONG", "action": "BUAT", "languageRow": "Bahasa", "languageTitle": "Bahasa", "subscriptionTitle": "Langganan", "privacyTitle": "Privasi", "termsTitle": "Terma langganan", "qaTitle": "Ujian dalaman", "mockDisclosure": "BAYARAN CUBA UNTUK PEMBANGUNAN", "continue": "Teruskan", "educationTitle": "Kenali kitaran", "learnMore": "Tengok lagi", "paywallTitle": "Satu cadangan berguna tiap-tiap hari.", "back": "Balek", "openSettings": "Buka tetapan", "aboutThea": "Pasal THEA"],
    ]
  }
}
extension LaunchUIQA {
  /// Default standalone --entry panel only. These cases never End QA into real data.
  func finalPassNode(_ identifier: String, in app: XCUIApplication) -> XCUIElement {
    app.descendants(matching: .any).matching(identifier: identifier).firstMatch
  }
  /// A small correction drag can be interpreted as a button press by iOS.
  /// Use an actual >=90pt vertical pan, then re-query the settled native bounds.
  func finalPassReveal(_ element: XCUIElement, in app: XCUIApplication) {
    func owner() -> XCUIElement {
      if element.exists {
        let found = app.scrollViews.containing(NSPredicate(format: "label == %@", element.label)).firstMatch
        if found.exists { return found }
      }
      return app.scrollViews.allElementsBoundByIndex.last ?? app.scrollViews.firstMatch
    }
    for _ in 0..<30 {
      let scroll = owner(), exists = element.exists
      let viewport = scroll.exists ? scroll.frame.intersection(app.frame) : app.frame
      if exists && viewport.contains(element.frame) {
        Thread.sleep(forTimeInterval: 0.35)
        if element.isHittable && app.frame.contains(element.frame) { break }
        continue // native route/layout transition; do not touch an unrelated control
      }
      guard scroll.exists else { break }
      let needed: CGFloat
      if exists {
        needed = element.frame.minY < viewport.minY
          ? viewport.minY - element.frame.minY + 16
          : viewport.maxY - element.frame.maxY - 16
      } else { needed = -viewport.height * 0.65 }
      let sign: CGFloat = needed >= 0 ? 1 : -1
      let distance = sign * min(viewport.height * 0.65, max(90, abs(needed)))
      let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: distance < 0 ? 0.8 : 0.2))
      start.press(forDuration: 0.05, thenDragTo: start.withOffset(CGVector(dx: 0, dy: distance)), withVelocity: .slow, thenHoldForDuration: 0.1)
    }
    XCTAssertTrue(element.exists)
    XCTAssertTrue(element.isHittable)
    XCTAssertTrue(app.frame.contains(element.frame), "The complete native control must fit the app viewport")
    let scroll = owner()
    if scroll.exists { XCTAssertTrue(scroll.frame.contains(element.frame), "The complete control must fit its native scroll viewport") }
  }
  func finalPassAssertIconFooter(in app: XCUIApplication, labels: [String: String]) {
    let back = app.buttons["secondary-back"].firstMatch
    let settings = app.buttons["secondary-settings"].firstMatch
    for element in [back, settings] {
      XCTAssertTrue(element.waitForExistence(timeout: 5))
      XCTAssertTrue(element.isHittable)
      XCTAssertTrue(app.frame.contains(element.frame))
      XCTAssertGreaterThanOrEqual(element.frame.width, 44)
      XCTAssertGreaterThanOrEqual(element.frame.height, 44)
      XCTAssertFalse(element.staticTexts.matching(NSPredicate(format: "label == %@", element.label)).firstMatch.exists,
        "Button names belong to accessibility; the screenshot must show only decorative icons")
    }
    XCTAssertEqual(back.label, labels["back"]!)
    XCTAssertEqual(settings.label, labels["settingsAXTitle"] ?? labels["settings"]!)
  }
  func finalPassTapFixed(_ element: XCUIElement, expecting destination: XCUIElement, in app: XCUIApplication) {
    XCTAssertTrue(element.waitForExistence(timeout: 5))
    XCTAssertTrue(element.isHittable && app.frame.contains(element.frame))
    element.tap()
    if !destination.waitForExistence(timeout: 2) {
      print("TIH_FINAL_PASS_FIXED_CENTER_RETRY \(element.identifier)")
      let frame = element.frame
      app.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: frame.midX - app.frame.minX, dy: frame.midY - app.frame.minY)).tap()
    }
    XCTAssertTrue(destination.waitForExistence(timeout: 5))
  }
  func finalPassOpenSettings(in app: XCUIApplication, labels: [String: String]) {
    let settingsTab = app.otherElements.matching(NSPredicate(format: "label ENDSWITH %@", ", " + labels["settings"]!)).firstMatch
    let secondary = app.buttons["secondary-settings"].firstMatch
    if secondary.exists { secondary.tap() }
    else {
      let todaySettings = app.buttons.matching(NSPredicate(format: "label IN %@", [labels["openSettings"]!, labels["settings"]!])).firstMatch
      if todaySettings.exists && todaySettings.isHittable { finalPassTapFixed(todaySettings, expecting: settingsTab, in: app) }
      else {
        let primary = app.otherElements.matching(NSPredicate(format: "label ENDSWITH %@", ", " + labels["settings"]!)).firstMatch
        if primary.exists && primary.isHittable { if !primary.isSelected { primary.tap() } }
        else {
          let about = app.buttons[labels["aboutThea"]!].firstMatch
          finalPassReveal(about, in: app)
          finalPassTapFixed(about, expecting: secondary, in: app)
          secondary.tap()
        }
      }
    }
    XCTAssertTrue(settingsTab.waitForExistence(timeout: 5))
    XCTAssertTrue(settingsTab.isSelected, "Verify the visible Settings tab, not an offscreen section's button")
  }
  func finalPassOpenLanguage(in app: XCUIApplication, labels: [String: String]) {
    finalPassOpenSettings(in: app, labels: labels)
    // The Settings language row displays the current autonym, not its section title.
    let language = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", labels["autonym"]!)).firstMatch
    finalPassReveal(language, in: app)
    language.tap()
    XCTAssertTrue(app.buttons["settings-language-en"].firstMatch.waitForExistence(timeout: 5))
  }
  func finalPassReturnToPanel(in app: XCUIApplication, labels: [String: String]) {
    finalPassOpenSettings(in: app, labels: labels)
    let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", labels["qaTitle"]!)).firstMatch
    finalPassReveal(row, in: app)
    row.tap()
    XCTAssertTrue(app.buttons["qa-scenario-fresh"].firstMatch.waitForExistence(timeout: 5))
  }
  func finalPassFixtureApp() throws -> XCUIApplication {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    XCTAssertNotEqual(app.state, .notRunning, "Root must first install/launch the standalone --entry panel artifact")
    clearExistingOpenConfirmation(for: app)
    app.activate()
    // Recover only a prior private-case UI draft; never reset/end the QA session.
    let cancelDraft = app.buttons["language-cancel"].firstMatch
    if cancelDraft.exists && cancelDraft.isHittable { cancelDraft.tap() }
    let locale = finalPassLabels.first(where: { app.staticTexts[$0.value["mockDisclosure"]!].firstMatch.exists })
    XCTAssertNotNil(locale, "Never use this case with normal Release/personal data")
    guard let current = locale else { return app }
    if current.key != "en" {
      finalPassOpenLanguage(in: app, labels: current.value)
      let english = app.buttons["settings-language-en"].firstMatch
      finalPassReveal(english, in: app)
      english.tap()
    }
    if !app.buttons["qa-scenario-fresh"].firstMatch.exists {
      finalPassReturnToPanel(in: app, labels: finalPassLabels["en"]!)
    }
    XCTAssertTrue(app.buttons["qa-scenario-fresh"].firstMatch.waitForExistence(timeout: 30))
    XCTAssertTrue(app.staticTexts[finalPassLabels["en"]!["mockDisclosure"]!].firstMatch.exists)
    return app
  }
  func finalPassSelectScenario(_ scenario: String, in app: XCUIApplication) {
    let option = app.buttons["qa-scenario-" + scenario].firstMatch
    finalPassReveal(option, in: app)
    let expectedName = option.label
    option.tap()
    let open = app.buttons["qa-open-selected"].firstMatch
    finalPassReveal(open, in: app)
    let ready = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true AND label CONTAINS %@", expectedName), object: open)
    XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 10), .completed)
  }
  func finalPassOpenSelected(in app: XCUIApplication) {
    finalPassOpenRouteControl("qa-open-selected", in: app)
  }
  func finalPassOpenRouteControl(_ identifier: String, in app: XCUIApplication) {
    let button = app.buttons[identifier].firstMatch
    finalPassReveal(button, in: app)
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: button)], timeout: 5), .completed)
    button.tap()
  }

  func testFinalPassStandaloneQALearnIconFooterAndCompactCycle() throws {
    let app = try finalPassFixtureApp(), labels = finalPassLabels["en"]!, process = try nativeProcess(in: app)
    finalPassSelectScenario("cycle-7", in: app)
    finalPassOpenSelected(in: app)
    _ = internalQAMind(in: app, day: 7)
    let learn = app.buttons[labels["learnMore"]!].firstMatch
    let firstPhase = finalPassNode("learn-phase-menstrual", in: app)
    finalPassTapFixed(learn, expecting: firstPhase, in: app)
    for phase in ["menstrual", "follicular", "mid_cycle", "luteal"] {
      let tab = finalPassNode("learn-phase-" + phase, in: app)
      finalPassReveal(tab, in: app)
      tab.tap()
      let content = finalPassNode("learn-content-" + phase, in: app)
      XCTAssertTrue(content.waitForExistence(timeout: 5))
      // Offscreen native AX descendants are not a measure of authored content.
      // Reveal and inspect every real body paragraph instead of counting children.
      for body in finalPassEnglishEducation[phase]! {
        let paragraph = app.staticTexts[body].firstMatch
        finalPassReveal(paragraph, in: app)
        XCTAssertEqual(paragraph.label, body)
        XCTAssertGreaterThan(paragraph.label.count, 50)
      }
      print("TIH_FINAL_PASS_EDUCATION_BODY_VERIFIED \(phase) 4")
      finalPassAssertIconFooter(in: app, labels: labels)
      let before = app.buttons["secondary-back"].firstMatch.frame
      let source = finalPassNode("learn-source-2", in: app)
      finalPassReveal(source, in: app)
      XCTAssertTrue(finalPassNode("learn-source-0", in: app).label.contains("NIH"))
      XCTAssertTrue(source.label.contains("NHS"))
      XCTAssertEqual(app.buttons["secondary-back"].firstMatch.frame.minY, before.minY, accuracy: 1)
      capture(app, "final-learn-" + phase + "-sources-icon-footer")
    }
    app.buttons["secondary-back"].firstMatch.tap()
    let mind = internalQAMind(in: app, day: 7)
    finalPassTapFixed(app.buttons[labels["learnMore"]!].firstMatch, expecting: firstPhase, in: app)
    finalPassOpenSettings(in: app, labels: labels) // actual gear destination
    let edit = app.buttons[labels["editCycle"]!].firstMatch
    tapNativePrimaryTab(labels["cycle"]!, in: app, expect: edit)
    XCTAssertEqual(app.frame.width, 375, accuracy: 1)
    XCTAssertEqual(app.frame.height, 667, accuracy: 1)
    // No scrolling before these assertions: all six calendar weeks must fit.
    let dateNodes = app.staticTexts.matching(NSPredicate(format: "label MATCHES %@", "^[0-9]{1,2}/[0-9]{1,2}/2026.*$")).allElementsBoundByIndex
    // Native AX can return duplicate date matches from retained route/text nodes.
    // Inspect distinct dates and their visible bounds; screenshots prove the grid.
    let dates = Dictionary(grouping: dateNodes, by: { $0.label })
    XCTAssertEqual(dates.count, 42)
    let body = app.scrollViews.firstMatch
    for (_, nodes) in dates {
      XCTAssertTrue(nodes.contains(where: { body.frame.contains($0.frame) && $0.frame.width > 0 && $0.frame.height > 0 }),
        "Every distinct calendar date must have visible native bounds at normal phone text size")
    }
    XCTAssertTrue(edit.isHittable && app.frame.contains(edit.frame))
    XCTAssertLessThanOrEqual(edit.frame.maxY, nativePrimaryTab(labels["cycle"]!, in: app).frame.minY + 1)
    capture(app, "final-compact-cycle-six-weeks-fixed-edit")
    edit.tap()
    let saved = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Last known period start:")).firstMatch
    XCTAssertTrue(saved.waitForExistence(timeout: 5))
    XCTAssertTrue(saved.label.contains("November 3, 2026"))
    XCTAssertTrue(app.staticTexts["28 days"].exists && app.staticTexts["5 days"].exists)
    capture(app, "final-compact-cycle-saved-editor-no-save")
    app.buttons[labels["back"]!].firstMatch.tap() // cancel local editing, never save
    XCTAssertTrue(edit.waitForExistence(timeout: 5))
    finalPassReturnToPanel(in: app, labels: labels)
    XCTAssertEqual(try nativeProcess(in: app), process)
    XCTAssertFalse(mind.isHittable)
    print("TIH_FINAL_PASS_EDUCATION_ICONS_COMPACT_CYCLE_SAME_PROCESS_PASS")
  }

  func testFinalPassStandaloneQAHorizontalLanguageDraftAndConfirmation() throws {
    let app = try finalPassFixtureApp(), english = finalPassLabels["en"]!, french = finalPassLabels["fr"]!
    let process = try nativeProcess(in: app)
    finalPassSelectScenario("fresh", in: app)
    finalPassOpenSelected(in: app)
    let open = app.buttons["language-picker-open"].firstMatch
    XCTAssertTrue(open.waitForExistence(timeout: 10))
    finalPassReveal(open, in: app)
    open.tap()
    let pages = finalPassNode("language-pages", in: app)
    XCTAssertTrue(pages.waitForExistence(timeout: 5))
    XCTAssertTrue((pages.value as? String ?? "").contains(english["autonym"]!))
    XCTAssertFalse(app.buttons["language-previous"].firstMatch.isEnabled)
    let start = pages.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.5))
    let end = pages.coordinate(withNormalizedOffset: CGVector(dx: 0.2, dy: 0.5))
    start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.3)
    let drafted = XCTNSPredicateExpectation(predicate: NSPredicate(format: "value CONTAINS %@", french["autonym"]!), object: pages)
    XCTAssertEqual(XCTWaiter.wait(for: [drafted], timeout: 5), .completed)
    capture(app, "final-language-horizontal-swipe-French-draft")
    app.buttons["language-cancel"].firstMatch.tap()
    XCTAssertTrue(open.waitForExistence(timeout: 5))
    XCTAssertTrue(open.label.contains(english["autonym"]!))
    XCTAssertTrue(app.buttons[english["continue"]!].exists)
    open.tap()
    app.buttons["language-next"].firstMatch.tap()
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "value CONTAINS %@", french["autonym"]!), object: pages)], timeout: 5), .completed)
    app.buttons["language-confirm"].firstMatch.tap()
    XCTAssertTrue(app.buttons[french["continue"]!].waitForExistence(timeout: 5))
    XCTAssertTrue(open.label.contains(french["autonym"]!))
    capture(app, "final-onboarding-French-confirmed")
    open.tap()
    app.buttons["language-previous"].firstMatch.tap()
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "value CONTAINS %@", english["autonym"]!), object: pages)], timeout: 5), .completed)
    let done = app.buttons["language-confirm"].firstMatch
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true AND hittable == true"), object: done)], timeout: 5), .completed)
    done.tap()
    XCTAssertTrue(app.buttons[english["continue"]!].waitForExistence(timeout: 5))
    XCTAssertTrue(open.label.contains(english["autonym"]!))
    finalPassReturnToPanel(in: app, labels: english)
    XCTAssertEqual(try nativeProcess(in: app), process)
    print("TIH_FINAL_PASS_LANGUAGE_SWIPE_DRAFT_CANCEL_CONFIRM_MEMORY_ONLY_PASS")
  }

  func finalPassLocaleTour(_ codes: [String]) throws {
    let app = try finalPassFixtureApp(), process = try nativeProcess(in: app)
    finalPassSelectScenario("cycle-7", in: app)
    var current = finalPassLabels["en"]!
    for code in codes {
      finalPassOpenSelected(in: app)
      // First iteration opens Today; use Learn's icon footer to reach Settings.
      let learn = app.buttons[current["learnMore"]!].firstMatch
      finalPassTapFixed(learn, expecting: finalPassNode("learn-phase-menstrual", in: app), in: app)
      finalPassOpenLanguage(in: app, labels: current)
      let option = app.buttons["settings-language-" + code].firstMatch
      finalPassReveal(option, in: app)
      option.tap()
      current = finalPassLabels[code]!
      XCTAssertTrue(app.staticTexts[current["languageTitle"]!].firstMatch.waitForExistence(timeout: 5))
      finalPassReturnToPanel(in: app, labels: current)
      finalPassOpenSelected(in: app)
      let mind = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", current["mind"]! + ".")).firstMatch
      XCTAssertTrue(mind.waitForExistence(timeout: 10))
      XCTAssertTrue(app.staticTexts[current["mockDisclosure"]!].firstMatch.exists)
      XCTAssertGreaterThan(mind.label.count, current["mind"]!.count + 30)
      capture(app, "final-language-" + code + "-actual-Today")
      finalPassTapFixed(app.buttons[current["learnMore"]!].firstMatch, expecting: finalPassNode("learn-phase-menstrual", in: app), in: app)
      XCTAssertTrue(app.staticTexts[current["educationTitle"]!].firstMatch.waitForExistence(timeout: 5))
      finalPassAssertIconFooter(in: app, labels: current)
      finalPassOpenSettings(in: app, labels: current)
      let edit = app.buttons[current["editCycle"]!].firstMatch
      tapNativePrimaryTab(current["cycle"]!, in: app, expect: edit)
      XCTAssertTrue(edit.exists && edit.isHittable)
      finalPassReturnToPanel(in: app, labels: current)
      finalPassOpenRouteControl("qa-open--settings-subscription", in: app)
      XCTAssertTrue(app.staticTexts[current["paywallTitle"]!].firstMatch.waitForExistence(timeout: 5))
      finalPassAssertIconFooter(in: app, labels: current)
      finalPassReturnToPanel(in: app, labels: current)
      finalPassOpenRouteControl("qa-open--privacy", in: app)
      XCTAssertTrue(app.staticTexts[current["privacyTitle"]!].firstMatch.waitForExistence(timeout: 5))
      finalPassAssertIconFooter(in: app, labels: current)
      finalPassReturnToPanel(in: app, labels: current)
      finalPassOpenRouteControl("qa-open--terms", in: app)
      XCTAssertTrue(app.staticTexts[current["termsTitle"]!].firstMatch.waitForExistence(timeout: 5))
      finalPassAssertIconFooter(in: app, labels: current)
      finalPassReturnToPanel(in: app, labels: current)
      print("TIH_FINAL_PASS_LOCALE_HEADERS_TODAY_CYCLE_LEARN_PAYWALL_PRIVACY_TERMS \(code)")
    }
    finalPassOpenSelected(in: app)
    finalPassTapFixed(app.buttons[current["learnMore"]!].firstMatch, expecting: finalPassNode("learn-phase-menstrual", in: app), in: app)
    finalPassOpenLanguage(in: app, labels: current)
    let english = app.buttons["settings-language-en"].firstMatch
    finalPassReveal(english, in: app)
    english.tap()
    finalPassReturnToPanel(in: app, labels: finalPassLabels["en"]!)
    XCTAssertEqual(try nativeProcess(in: app), process)
    print("TIH_FINAL_PASS_LOCALE_CASE_COMPLETE \(codes.joined(separator: ",")) RESTORED_ENGLISH_MEMORY_ONLY")
  }
  func testFinalPassStandaloneQAAllElevenLocalizedMajorScreens() throws {
    try finalPassLocaleTour(["en", "fr", "it", "es", "de", "ru", "uk", "hi", "zh-Hans", "ms", "mbf"])
  }
  func testFinalPassStandaloneQALocaleEN() throws { try finalPassLocaleTour(["en"]) }
  func testFinalPassStandaloneQALocaleFR() throws { try finalPassLocaleTour(["fr"]) }
  func testFinalPassStandaloneQALocaleIT() throws { try finalPassLocaleTour(["it"]) }
  func testFinalPassStandaloneQALocaleES() throws { try finalPassLocaleTour(["es"]) }
  func testFinalPassStandaloneQALocaleDE() throws { try finalPassLocaleTour(["de"]) }
  func testFinalPassStandaloneQALocaleRU() throws { try finalPassLocaleTour(["ru"]) }
  func testFinalPassStandaloneQALocaleUK() throws { try finalPassLocaleTour(["uk"]) }
  func testFinalPassStandaloneQALocaleHI() throws { try finalPassLocaleTour(["hi"]) }
  func testFinalPassStandaloneQALocaleZHHans() throws { try finalPassLocaleTour(["zh-Hans"]) }
  func testFinalPassStandaloneQALocaleMS() throws { try finalPassLocaleTour(["ms"]) }
  func testFinalPassStandaloneQALocaleMBF() throws { try finalPassLocaleTour(["mbf"]) }

  /// Run separately only after root installs the normal artifact, never the private QA bundle.
  func testFinalPassNormalReleaseRussianPersistsColdThenRestoreEnglish() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    let en = finalPassLabels["en"]!, ru = finalPassLabels["ru"]!
    app.activate()
    XCTAssertTrue(app.buttons["brand-home"].firstMatch.waitForExistence(timeout: 30))
    XCTAssertFalse(app.buttons["qa-scenario-fresh"].exists)
    for label in Set(finalPassLabels.values.map { $0["mockDisclosure"]! }) { XCTAssertFalse(app.staticTexts[label].firstMatch.exists, "Normal-only persistence case must reject private QA") }
    var restoreNeeded = false
    defer {
      if restoreNeeded {
        app.activate()
        if !app.buttons["settings-language-en"].firstMatch.exists { finalPassOpenLanguage(in: app, labels: ru) }
        let english = app.buttons["settings-language-en"].firstMatch
        finalPassReveal(english, in: app)
        english.tap()
      }
    }
    finalPassOpenLanguage(in: app, labels: en)
    let russian = app.buttons["settings-language-ru"].firstMatch
    finalPassReveal(russian, in: app)
    russian.tap(); restoreNeeded = true
    XCTAssertTrue(app.staticTexts[ru["languageTitle"]!].firstMatch.waitForExistence(timeout: 5))
    capture(app, "final-normal-Russian-language-before-cold")
    app.terminate(); app.launch()
    XCTAssertTrue(app.buttons["brand-home"].firstMatch.waitForExistence(timeout: 30))
    XCTAssertFalse(app.buttons["qa-scenario-fresh"].exists)
    for label in Set(finalPassLabels.values.map { $0["mockDisclosure"]! }) { XCTAssertFalse(app.staticTexts[label].firstMatch.exists) }
    finalPassOpenLanguage(in: app, labels: ru)
    XCTAssertTrue(app.staticTexts[ru["languageTitle"]!].firstMatch.exists)
    XCTAssertTrue(app.buttons["settings-language-ru"].firstMatch.isSelected, "The selected language is an accessibility state; its decorative checkmark is hidden")
    capture(app, "final-normal-Russian-restored-after-cold")
    let english = app.buttons["settings-language-en"].firstMatch
    finalPassReveal(english, in: app)
    english.tap()
    XCTAssertTrue(app.staticTexts[en["languageTitle"]!].firstMatch.waitForExistence(timeout: 5))
    restoreNeeded = false
    finalPassOpenSettings(in: app, labels: en)
    capture(app, "final-normal-English-restored-no-data-reset")
    print("TIH_FINAL_PASS_NORMAL_RU_COLD_PERSISTENCE_RESTORED_ENGLISH_NO_RESET")
  }
}

// FINAL_PASS_20261115_END

extension LaunchUIQA {
  var finalPassEnglishEducation: [String: [String]] {
    [
      "menstrual": ["Day 1 is the first day of bleeding. A period often lasts 2–7 days.", "The uterine lining is shed. Cramps or discomfort may occur.", "Some feel tired or need more rest; others notice little change.", "Ask what helps. Offer practical help, rest or warmth if wanted."],
      "follicular": ["From the first day of bleeding until ovulation; its length varies. Menstruation overlaps this ovarian phase.", "Follicles develop in the ovaries and the uterine lining rebuilds.", "Energy may feel different as bleeding eases, but no particular mood or productivity is guaranteed.", "Plan together around her actual energy, without assuming she should feel more social."],
      "mid_cycle": ["An egg is released; often about 12–16 days before the next period, not always day 14.", "Some notice brief one-sided pelvic discomfort; many notice nothing.", "No specific emotional or energy pattern is universal.", "Listen to her preferences about plans, closeness and space. A calendar is not consent."],
      "luteal": ["After ovulation until the next period; often around two weeks, with individual variation.", "Some experience bloating, breast tenderness or headaches before bleeding.", "PMS can include tiredness, irritability or emotional changes; it does not affect everyone.", "Offer help with daily tasks and flexible plans. Take difficult symptoms seriously."],
    ]
  }
}

extension LaunchUIQA {
  /// Recheck final rebundled iOS imports after the Android-only picker addition.
  func testFinalPassCurrentQAQuickTodayAndCompactCycle() throws {
    let app = try finalPassFixtureApp(), labels = finalPassLabels["en"]!, process = try nativeProcess(in: app)
    finalPassSelectScenario("cycle-7", in: app)
    finalPassOpenSelected(in: app)
    let mind = internalQAMind(in: app, day: 7)
    XCTAssertGreaterThan(mind.label.count, 60)
    capture(app, "final-current-QA-actual-Today-day7")
    finalPassTapFixed(app.buttons[labels["learnMore"]!].firstMatch,
      expecting: finalPassNode("learn-phase-menstrual", in: app), in: app)
    capture(app, "final-current-QA-menstrual-body-top")
    finalPassOpenSettings(in: app, labels: labels)
    let edit = app.buttons[labels["editCycle"]!].firstMatch
    tapNativePrimaryTab(labels["cycle"]!, in: app, expect: edit)
    let dates = app.staticTexts.matching(NSPredicate(format: "label MATCHES %@", "^[0-9]{1,2}/[0-9]{1,2}/2026.*$")).allElementsBoundByIndex
    XCTAssertEqual(Set(dates.map { $0.label }).count, 42)
    XCTAssertTrue(edit.isHittable && app.frame.contains(edit.frame))
    XCTAssertLessThanOrEqual(edit.frame.maxY, nativePrimaryTab(labels["cycle"]!, in: app).frame.minY + 1)
    capture(app, "final-current-QA-compact-Cycle")
    finalPassReturnToPanel(in: app, labels: labels)
    XCTAssertEqual(try nativeProcess(in: app), process)
    print("TIH_FINAL_PASS_CURRENT_QA_TODAY_CYCLE_SAME_PROCESS_PASS")
  }
}

extension LaunchUIQA {
  var finalFooterUpdateLabels: [String: String] { [
    "en": "Update cycle",
    "fr": "Actualiser le cycle",
    "it": "Aggiorna ciclo",
    "es": "Actualizar ciclo",
    "de": "Zyklus aktualisieren",
    "ru": "Обновить цикл",
    "uk": "Оновити цикл",
    "hi": "चक्र अपडेट करें",
    "zh-Hans": "更新周期",
    "ms": "Kemas kini kitaran",
    "mbf": "Tukar maklumat kitaran",
  ] }
}

extension LaunchUIQA {
  /// Direct --entry today private artifact, normal text size on owned SE3 only.
  /// This checks the one-constant footer-width correction, not another full tour.
  func testFinalFooterAllElevenTodayWidthAndHitLabels() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    XCTAssertNotEqual(app.state, .notRunning, "Root installs and cold-records the final direct-Today QA artifact first")
    clearExistingOpenConfirmation(for: app)
    app.activate()
    let english = finalPassLabels["en"]!
    XCTAssertTrue(app.staticTexts[english["mockDisclosure"]!].firstMatch.waitForExistence(timeout: 30), "Never drive the normal/personal app")
    XCTAssertTrue(app.buttons[english["learnMore"]!].firstMatch.waitForExistence(timeout: 15))
    XCTAssertEqual(app.frame.width, 375, accuracy: 1)
    XCTAssertEqual(app.frame.height, 667, accuracy: 1)
    let process = try nativeProcess(in: app)
    var current = english
    for code in ["en", "fr", "it", "es", "de", "ru", "uk", "hi", "zh-Hans", "ms", "mbf"] {
      let next = finalPassLabels[code]!
      if code != "en" {
        finalPassOpenLanguage(in: app, labels: current)
        let option = app.buttons["settings-language-" + code].firstMatch
        finalPassReveal(option, in: app)
        option.tap()
        XCTAssertTrue(app.staticTexts[next["languageTitle"]!].firstMatch.waitForExistence(timeout: 5))
        finalPassOpenSettings(in: app, labels: next)
        tapNativePrimaryTab(next["advice"]!, in: app, expect: app.buttons[next["learnMore"]!].firstMatch)
      }
      finalFooterAssert(code, in: app)
      current = next
    }
    // Existing preference controls restore the disposable QA memory locale.
    finalPassOpenLanguage(in: app, labels: current)
    let englishOption = app.buttons["settings-language-en"].firstMatch
    finalPassReveal(englishOption, in: app)
    englishOption.tap()
    finalPassOpenSettings(in: app, labels: english)
    tapNativePrimaryTab(english["advice"]!, in: app, expect: app.buttons[english["learnMore"]!].firstMatch)
    XCTAssertTrue(app.staticTexts[english["mockDisclosure"]!].firstMatch.exists)
    XCTAssertEqual(try nativeProcess(in: app), process)
    print("TIH_FINAL_FOOTER_ALL11_SAME_PROCESS_ENGLISH_RESTORED")
  }
}

extension LaunchUIQA {
  func finalFooterAssert(_ code: String, in app: XCUIApplication) {
    let labels = finalPassLabels[code]!
    XCTAssertTrue(app.staticTexts[labels["mockDisclosure"]!].firstMatch.exists)
    var frames: [CGRect] = []
    for label in [labels["learnMore"]!, finalFooterUpdateLabels[code]!, labels["openSettings"]!] {
      let button = app.buttons[label].firstMatch
      XCTAssertTrue(button.waitForExistence(timeout: 5))
      XCTAssertTrue(button.isHittable && app.frame.contains(button.frame))
      XCTAssertEqual(button.label, label)
      XCTAssertGreaterThanOrEqual(button.frame.width, 44)
      XCTAssertGreaterThanOrEqual(button.frame.height, 44)
      // UK needs two intact word lines; MBF naturally has three whole words/lines.
      let maximumHeight: CGFloat = code == "mbf" ? 76.5 : 56.5
      XCTAssertLessThanOrEqual(button.frame.height, maximumHeight,
        "Keep full labels; MBF may use three whole-word lines without shrinking")
      frames.append(button.frame)
    }
    XCTAssertLessThanOrEqual(frames[0].maxX, frames[1].minX + 1)
    XCTAssertLessThanOrEqual(frames[1].maxX, frames[2].minX + 1)
    capture(app, "footer-final-" + code + "-actual-Today")
    print("TIH_FINAL_FOOTER_LOCALE_PASS \(code) MAX_HEIGHT \(frames.map { $0.height }.max()!)")
  }

  /// Resume only MBF after the aggregate's overstrict two-line test constraint.
  func testFinalFooterMBFWholeWordLinesAndEnglishCleanup() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    if app.state == .notRunning { app.launch() } else { app.activate() }
    let en = finalPassLabels["en"]!, mbf = finalPassLabels["mbf"]!
    let disclosure = app.staticTexts.matching(NSPredicate(format: "label IN %@", [en["mockDisclosure"]!, mbf["mockDisclosure"]!])).firstMatch
    XCTAssertTrue(disclosure.waitForExistence(timeout: 30), "Require actual private QA before any preference action")
    let process = try nativeProcess(in: app)
    if app.staticTexts[en["mockDisclosure"]!].firstMatch.exists {
      finalPassOpenLanguage(in: app, labels: en)
      let option = app.buttons["settings-language-mbf"].firstMatch
      finalPassReveal(option, in: app)
      option.tap()
      XCTAssertTrue(app.staticTexts[mbf["languageTitle"]!].firstMatch.waitForExistence(timeout: 5))
      finalPassOpenSettings(in: app, labels: mbf)
      tapNativePrimaryTab(mbf["advice"]!, in: app, expect: app.buttons[mbf["learnMore"]!].firstMatch)
    }
    finalFooterAssert("mbf", in: app)
    finalPassOpenLanguage(in: app, labels: mbf)
    let english = app.buttons["settings-language-en"].firstMatch
    finalPassReveal(english, in: app)
    english.tap()
    finalPassOpenSettings(in: app, labels: en)
    tapNativePrimaryTab(en["advice"]!, in: app, expect: app.buttons[en["learnMore"]!].firstMatch)
    XCTAssertTrue(app.staticTexts[en["mockDisclosure"]!].firstMatch.exists)
    XCTAssertEqual(try nativeProcess(in: app), process)
    print("TIH_FINAL_FOOTER_MBF_FULL_WORDS_ENGLISH_CLEANUP_SAME_PROCESS_PASS")
  }
}
