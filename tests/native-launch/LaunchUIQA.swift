import XCTest

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
    if !reduce.exists {
      let accessibility = settings.staticTexts["Accessibility"].firstMatch
      for _ in 0..<8 {
        if accessibility.isHittable { break }
        settings.swipeUp(velocity: .slow)
      }
      XCTAssertTrue(accessibility.isHittable)
      accessibility.tap()
      let motion = settings.staticTexts["Motion"].firstMatch
      for _ in 0..<6 {
        if motion.isHittable { break }
        settings.swipeUp(velocity: .slow)
      }
      XCTAssertTrue(motion.isHittable)
      motion.tap()
    }
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
  func completeOnboardingAssertions(in app: XCUIApplication) throws {
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
    capture(app, "06-synthetic-date-default")
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
    capture(app, "25-largest-type-date-no-change")
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
    try completeOnboardingAssertions(in: app)
  }
}
