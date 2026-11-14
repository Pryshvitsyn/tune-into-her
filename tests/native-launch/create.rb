require 'xcodeproj'
require 'fileutils'

# Keep this UI-only test project outside the application repository.
root = File.expand_path(ARGV.fetch(0, '/tmp/tih-launch-native-uiqa'))
unless root.start_with?('/tmp/') || root.start_with?('/private/tmp/')
  abort 'Use a destination below /tmp; never generate a native target in the app repository.'
end
FileUtils.mkdir_p(root)
sources = ['LaunchUIQA.swift', 'StatusBarPixels.swift']
sources.each { |name| FileUtils.cp(File.join(__dir__, name), File.join(root, name)) }
project = Xcodeproj::Project.new(File.join(root, 'LaunchUIQA.xcodeproj'))
project.root_object.attributes['LastUpgradeCheck'] = '2660'
target = project.new_target(:ui_test_bundle, 'LaunchUIQA', :ios, '16.4')
sources.each do |name|
  file = project.main_group.new_file(name)
  target.source_build_phase.add_file_reference(file)
end
target.build_configurations.each do |c|
  c.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.eliogenesis.tihlaunch.uiqa'
  c.build_settings['SWIFT_VERSION'] = '5.0'
  c.build_settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  c.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
  c.build_settings['CODE_SIGN_IDENTITY'] = '-'
  c.build_settings['DEVELOPMENT_TEAM'] = ''
  c.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
  c.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'YES'
  c.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
  c.build_settings['SWIFT_OPTIMIZATION_LEVEL'] = '-Onone'
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.add_test_target(target)
scheme.test_action.build_configuration = 'Debug'
scheme.save_as(project.path, 'LaunchUIQA', true)
