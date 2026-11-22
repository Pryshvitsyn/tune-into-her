// Appended only to a separately generated runner with a newly created Simulator
// UUID embedded in the existing simulator-only setUp guard. Never use on a phone.
extension LaunchUIQA {
  func requireNormalRelease(_ app: XCUIApplication) {
    XCTAssertFalse(app.buttons["qa-scenario-fresh"].exists)
    for labels in finalPassLabels.values {
      XCTAssertFalse(app.staticTexts[labels["mockDisclosure"]!].firstMatch.exists)
    }
  }
  func releaseCapture(_ app: XCUIApplication, _ name: String) {
    capture(app, "release-" + name, checkStatusBar: false)
  }
  func releaseTap(_ element: XCUIElement, in app: XCUIApplication) {
    XCTAssertTrue(element.waitForExistence(timeout: 10))
    if !element.isHittable || !app.frame.contains(element.frame) { finalPassReveal(element, in: app) }
    XCTAssertTrue(element.isHittable && app.frame.contains(element.frame))
    element.tap()
  }
  func releaseHome(_ app: XCUIApplication, expecting destination: XCUIElement) {
    let home = app.buttons["brand-home"].firstMatch
    XCTAssertTrue(home.waitForExistence(timeout: 10))
    home.tap()
    if !destination.waitForExistence(timeout: 30) {
      // Retry only if the original screen still exposes Home. Never tap again
      // during a running cover or shorten the full animation to satisfy a test.
      XCTAssertTrue(home.exists && home.isHittable)
      home.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }
    XCTAssertTrue(destination.waitForExistence(timeout: 30))
  }
  func releaseConfirmSyntheticDate(_ app: XCUIApplication) {
    let field = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Last known period start:")).firstMatch
    XCTAssertTrue(field.waitForExistence(timeout: 5)); XCTAssertTrue(field.label.hasSuffix("Not set"))
    XCTAssertFalse(app.buttons["Continue"].isEnabled)
    let picker = app.datePickers.firstMatch
    finalPassReveal(field, in: app)
    // Reuse the observed semantic-hit/visible-center fallback of the native harness.
    finalPassTapFixed(field, expecting: picker, in: app)
    releaseCapture(app, "date-open-native-geometry")
    let cancel = app.buttons["Cancel"].firstMatch
    finalPassReveal(cancel, in: app, horizontalFraction: 0.04); releaseTap(cancel, in: app)
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: picker)], timeout: 5), .completed)
    XCTAssertTrue(field.label.hasSuffix("Not set")); XCTAssertFalse(app.buttons["Continue"].isEnabled)
    finalPassReveal(field, in: app); finalPassTapFixed(field, expecting: picker, in: app)
    let done = app.buttons["Done"].firstMatch
    finalPassReveal(done, in: app, horizontalFraction: 0.04); releaseTap(done, in: app)
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: app.buttons["Continue"])], timeout: 5), .completed)
    XCTAssertFalse(field.label.hasSuffix("Not set")); XCTAssertTrue(app.buttons["Continue"].isEnabled)
  }
  func testReleaseFreshOnboardingAndRealSandboxTrial() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    app.launch()
    let picker = app.buttons["language-picker-open"].firstMatch
    XCTAssertTrue(picker.waitForExistence(timeout: 90), "Fresh normal startup must reach onboarding")
    requireNormalRelease(app)
    releaseCapture(app, "01-normal-onboarding")
    // Checking adds a visible ✓ child to the native label. Match the stable text
    // and role so the same checkbox can be observed after its state changes.
    let ack = app.otherElements.matching(NSPredicate(format: "label CONTAINS %@", "I understand and will use estimates respectfully")).firstMatch
    finalPassTapFixed(app.buttons["Continue"], expecting: ack, in: app)
    finalPassReveal(ack, in: app); ack.tap()
    let checked = NSPredicate(format: "value CONTAINS %@ AND NOT (value CONTAINS %@)", "checked", "unchecked")
    if XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: checked, object: ack)], timeout: 2) != .completed { releaseTap(ack, in: app) }
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: checked, object: ack)], timeout: 5), .completed)
    let date = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Last known period start:")).firstMatch
    finalPassTapFixed(app.buttons["Continue"], expecting: date, in: app)
    releaseConfirmSyntheticDate(app)
    finalPassTapFixed(app.buttons["Continue"], expecting: app.staticTexts["What is typical?"].firstMatch, in: app)
    XCTAssertTrue(app.staticTexts["What is typical?"].firstMatch.waitForExistence(timeout: 5))
    XCTAssertTrue(app.staticTexts["28 days"].firstMatch.exists)
    XCTAssertTrue(app.staticTexts["5 days"].firstMatch.exists)
    finalPassTapFixed(app.buttons["Continue"], expecting: app.staticTexts["Here’s today at a glance"].firstMatch, in: app)
    XCTAssertTrue(app.staticTexts["Here’s today at a glance"].firstMatch.waitForExistence(timeout: 5))
    let reminder = app.switches.firstMatch
    finalPassTapFixed(app.buttons["Continue"], expecting: reminder, in: app)
    XCTAssertTrue(reminder.waitForExistence(timeout: 5))
    if reminder.value as? String == "1" { releaseTap(reminder, in: app) }
    let start = app.buttons["Start 14 days free"].firstMatch
    finalPassTapFixed(app.buttons["Open today"], expecting: start, in: app)
    XCTAssertTrue(start.waitForExistence(timeout: 20))
    requireNormalRelease(app)
    releaseCapture(app, "02-explicit-card-free-start")
    releaseTap(start, in: app) // Real isolated Cloudflare sandbox guest trial, no store purchase.
    let mind = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "KEEP IN MIND.")).firstMatch
    XCTAssertTrue(mind.waitForExistence(timeout: 30), "Server-verified trial must unlock actual authored Today")
    XCTAssertGreaterThan(mind.label.count, 45)
    requireNormalRelease(app)
    releaseCapture(app, "03-real-trial-Today")
    app.terminate(); app.launch()
    XCTAssertTrue(mind.waitForExistence(timeout: 45), "Cold restart must preserve server trial access")
    requireNormalRelease(app)
    releaseCapture(app, "04-real-trial-cold-restart")
    print("TIH_REAL_SANDBOX_TRIAL_NORMAL_NATIVE_ONBOARDING_TODAY_COLD_RESTART_PASS")
  }
  func testReleaseElevenNormalLocalesWithoutMocks() throws {
    try releaseVerifyNormalLocales(["en", "fr", "it", "es", "de", "ru", "uk", "hi", "zh-Hans", "ms", "mbf"])
  }
  func testReleaseNormalLocalesLatin() throws {
    try releaseVerifyNormalLocales(["en", "fr", "it", "es", "de"])
  }
  func testReleaseNormalLocalesCyrillicHindi() throws {
    try releaseVerifyNormalLocales(["ru", "uk", "hi"])
  }
  func testReleaseNormalLocalesChineseMalay() throws {
    try releaseVerifyNormalLocales(["zh-Hans", "ms", "mbf"])
  }
  // Optional recovery case only for the observed failed fixture, after the host
  // has recovered disk space. Never dismisses an error during an acceptance loop.
  func testReleaseRecoverPriorDiskSaveError() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    app.activate()
    let alert = app.alerts["भाषा सहेजी नहीं जा सकी। फिर कोशिश करें।"].firstMatch
    XCTAssertTrue(alert.waitForExistence(timeout: 5))
    releaseCapture(app, "rejected-low-disk-save-error")
    alert.buttons["OK"].tap()
    releaseChooseLanguage(app, code: "zh-Hans")
    XCTAssertFalse(app.alerts.firstMatch.exists)
    requireNormalRelease(app)
    releaseCapture(app, "normal-language-save-recovered")
    print("TIH_NORMAL_LANGUAGE_SAVE_RECOVERED_AFTER_HOST_DISK_CLEANUP")
  }
  func releaseVerifyNormalLocales(_ codes: [String]) throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    app.activate()
    // A previous interrupted run may have persisted another normal UI language.
    // Observe the actual visible Today control instead of resetting preferences.
    let selectedCode = finalPassLabels.keys.first {
      let option = app.buttons["settings-language-" + $0].firstMatch
      return option.exists && option.label.contains("✓")
    }
    let visibleLocale = finalPassLabels.first {
      app.buttons[$0.value["openSettings"]!].firstMatch.exists || app.buttons[$0.value["editCycle"]!].firstMatch.exists
    }
    var current = try XCTUnwrap(selectedCode.flatMap { finalPassLabels[$0] } ?? visibleLocale?.value,
      "Begin on real trial Today, Cycle or language settings")
    for code in codes {
      releaseOpenLanguage(app, labels: current)
      releaseChooseLanguage(app, code: code)
      current = finalPassLabels[code]!
      XCTAssertTrue(app.staticTexts[current["languageTitle"]!].firstMatch.waitForExistence(timeout: 5))
      requireNormalRelease(app)
      finalPassOpenSettings(in: app, labels: current)
      let edit = app.buttons[current["editCycle"]!].firstMatch
      tapNativePrimaryTab(current["cycle"]!, in: app, expect: edit)
      releaseCapture(app, "locale-" + code + "-cycle")
      let mind = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", current["mind"]! + ".")).firstMatch
      releaseHome(app, expecting: mind)
      XCTAssertGreaterThan(mind.label.count, current["mind"]!.count + 30)
      requireNormalRelease(app)
      releaseCapture(app, "locale-" + code + "-Today")
      let learn = app.buttons[current["learnMore"]!].firstMatch
      finalPassTapFixed(learn, expecting: finalPassNode("learn-phase-menstrual", in: app), in: app)
      XCTAssertTrue(app.staticTexts[current["educationTitle"]!].firstMatch.waitForExistence(timeout: 5))
      releaseCapture(app, "locale-" + code + "-Learn")
      print("TIH_NORMAL_NATIVE_LOCALE_TODAY_CYCLE_LEARN_SETTINGS_PASS \(code)")
    }
    releaseOpenLanguage(app, labels: current)
    releaseChooseLanguage(app, code: "en")
    finalPassOpenSettings(in: app, labels: finalPassLabels["en"]!)
    releaseHome(app, expecting: app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "KEEP IN MIND.")).firstMatch)
  }
  func releaseOpenLanguage(_ app: XCUIApplication, labels: [String: String]) {
    finalPassOpenSettings(in: app, labels: labels)
    let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", labels["autonym"]!)).firstMatch
    finalPassReveal(row, in: app)
    finalPassTapFixed(row, expecting: app.buttons["settings-language-en"].firstMatch, in: app)
    XCTAssertTrue(app.buttons["settings-language-en"].firstMatch.waitForExistence(timeout: 10))
  }
  func releaseChooseLanguage(_ app: XCUIApplication, code: String) {
    let option = app.buttons["settings-language-" + code].firstMatch
    finalPassReveal(option, in: app); option.tap()
    let checked = NSPredicate(format: "label CONTAINS %@", "✓")
    if XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: checked, object: option)], timeout: 2) != .completed {
      option.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: checked, object: option)], timeout: 5), .completed)
    XCTAssertTrue(app.staticTexts[finalPassLabels[code]!["languageTitle"]!].firstMatch.waitForExistence(timeout: 5))
  }
  func releaseAssertBackground(_ app: XCUIApplication, dark: Bool) throws {
    let image = try XCTUnwrap(app.screenshot().image.cgImage)
    let context = try XCTUnwrap(CGContext(data: nil, width: 1, height: 1,
      bitsPerComponent: 8, bytesPerRow: 4, space: CGColorSpaceCreateDeviceRGB(),
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
    // Centered gap below the system clock and above the app header, independent
    // of the earlier 375pt status-bar glyph calibration.
    let rect = CGRect(x: CGFloat(image.width) * 0.45, y: CGFloat(image.height) * 0.066,
      width: CGFloat(image.width) * 0.1, height: CGFloat(image.height) * 0.005)
    let sample = try XCTUnwrap(image.cropping(to: rect))
    context.draw(sample, in: CGRect(x: 0, y: 0, width: 1, height: 1))
    let rgba = try XCTUnwrap(context.data).assumingMemoryBound(to: UInt8.self)
    let mean = (Double(rgba[0]) + Double(rgba[1]) + Double(rgba[2])) / 3
    if dark { XCTAssertLessThan(mean, 90) } else { XCTAssertGreaterThan(mean, 150) }
  }
  func testReleaseRealTrialThemesDocumentsAndReducedMotion() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    app.activate()
    let mind = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "KEEP IN MIND.")).firstMatch
    XCTAssertTrue(mind.waitForExistence(timeout: 45))
    let labels = finalPassLabels["en"]!
    func appearance(_ theme: String) {
      finalPassOpenSettings(in: app, labels: labels)
      let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Appearance")).firstMatch
      finalPassReveal(row, in: app)
      finalPassTapFixed(row, expecting: app.buttons["secondary-back"].firstMatch, in: app)
      let option = app.descendants(matching: .any).matching(NSPredicate(format: "label ENDSWITH %@", theme)).firstMatch
      finalPassReveal(option, in: app); option.tap()
      let checked = NSPredicate(format: "enabled == true AND label CONTAINS %@", "●")
      if XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: checked, object: option)], timeout: 2) != .completed {
        option.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
      }
      XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: checked, object: option)], timeout: 5), .completed)
    }
    appearance("Dark")
    try releaseAssertBackground(app, dark: true)
    releaseHome(app, expecting: mind)
    try releaseAssertBackground(app, dark: true)
    releaseCapture(app, "normal-Dark-Today")
    app.terminate(); app.launch()
    XCTAssertTrue(mind.waitForExistence(timeout: 45))
    try releaseAssertBackground(app, dark: true)
    appearance("Light")
    try releaseAssertBackground(app, dark: false)
    finalPassOpenSettings(in: app, labels: labels)
    for (prefix, title) in [("Privacy", "Privacy"), ("Subscription terms", "Subscription terms"), ("Subscription", "Subscription")] {
      let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", prefix)).firstMatch
      finalPassReveal(row, in: app)
      finalPassTapFixed(row, expecting: app.buttons["secondary-back"].firstMatch, in: app)
      XCTAssertTrue(app.staticTexts[title].firstMatch.waitForExistence(timeout: 5))
      requireNormalRelease(app)
      if prefix == "Subscription" {
        let restore = app.buttons["billing-restore"].firstMatch
        finalPassReveal(restore, in: app)
        XCTAssertTrue(restore.isEnabled)
        XCTAssertFalse(app.buttons["billing-start-trial"].firstMatch.exists, "Real existing trial must not be restarted")
      }
      releaseCapture(app, "normal-" + prefix.replacingOccurrences(of: " ", with: "-"))
      releaseTap(app.buttons["secondary-settings"].firstMatch, in: app)
    }
    releaseHome(app, expecting: mind)
    app.open(URL(string: "tuneintoher://history")!)
    XCTAssertTrue(app.staticTexts["Previous guidance"].firstMatch.waitForExistence(timeout: 10))
    XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label MATCHES %@", "20[0-9]{2}-[0-9]{2}-[0-9]{2}")).firstMatch.exists)
    requireNormalRelease(app); releaseCapture(app, "normal-History")
    releaseHome(app, expecting: mind)
    let settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
    settings.activate()
    let reduce = openMotionSettings(in: settings)
    XCTAssertTrue(reduce.waitForExistence(timeout: 10))
    XCTAssertFalse(UIAccessibility.isReduceMotionEnabled)
    defer { restoreReducedMotionOff(in: settings); app.activate() }
    reduce.descendants(matching: .switch).firstMatch.tap()
    XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", "1"), object: reduce)], timeout: 5), .completed)
    XCTAssertTrue(UIAccessibility.isReduceMotionEnabled)
    app.terminate()
    let began = Date(); app.launch()
    XCTAssertTrue(mind.waitForExistence(timeout: 8), "Reduced Motion must reach real Today without full intro")
    XCTAssertLessThan(Date().timeIntervalSince(began), 9)
    requireNormalRelease(app); try releaseAssertBackground(app, dark: false)
    releaseCapture(app, "normal-Reduced-Motion-Today")
    print("TIH_NORMAL_RELEASE_REAL_TRIAL_THEMES_DOCUMENTS_HISTORY_REDUCED_MOTION_PASS")
  }
  func testFinalBillingNativeStoreAvailabilityAndRetry() throws {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "com.eliogenesis.tuneintoher")
    app.launch()
    let mind = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "KEEP IN MIND.")).firstMatch
    XCTAssertTrue(mind.waitForExistence(timeout: 45))
    requireNormalRelease(app)
    finalPassOpenSettings(in: app, labels: finalPassLabels["en"]!)
    let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Subscription")).firstMatch
    finalPassReveal(row, in: app)
    finalPassTapFixed(row, expecting: app.buttons["billing-restore"].firstMatch, in: app)
    let unavailable = app.staticTexts["The store offer could not be loaded. No price or trial has been assumed."].firstMatch
    let monthly = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Monthly")).firstMatch
    let retry = app.buttons["billing-retry"].firstMatch
    let end = Date().addingTimeInterval(50)
    while !retry.exists && !monthly.exists && Date() < end { RunLoop.current.run(until: Date().addingTimeInterval(0.3)) }
    XCTAssertTrue(retry.exists || monthly.exists, "Native offering must resolve or expose recoverable failure")
    requireNormalRelease(app)
    releaseCapture(app, "native-store-offering-first-result")
    if retry.exists {
      finalPassReveal(retry, in: app)
      XCTAssertTrue(retry.isEnabled)
      retry.tap()
      XCTAssertTrue(retry.waitForExistence(timeout: 50), "Retry must return a recoverable store state")
      releaseCapture(app, "native-store-retry-result")
      print("TIH_NATIVE_REAL_KEY_STORE_OFFERS_UNAVAILABLE_RECOVERABLE_NO_PURCHASE")
    } else { print("TIH_NATIVE_REAL_KEY_STORE_PRODUCTS_RENDERED_NO_PURCHASE") }
    let restore = app.buttons["billing-restore"].firstMatch
    finalPassReveal(restore, in: app)
    XCTAssertTrue(restore.isEnabled)
    XCTAssertFalse(app.buttons["billing-start-trial"].firstMatch.exists)
    releaseHome(app, expecting: mind)
    XCTAssertTrue(mind.waitForExistence(timeout: 30), "Independent trial remains usable after store failure")
    releaseCapture(app, "native-store-return-real-trial-today")
  }

}
