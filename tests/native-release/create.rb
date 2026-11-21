require 'json'
require 'open3'
root = File.expand_path(ARGV.fetch(0))
abort 'Use a new /tmp directory' unless root.start_with?('/tmp/') && !File.exist?(root)
creator = File.expand_path('../native-launch/create.rb', __dir__)
abort 'Runner generation failed' unless system('ruby', creator, root)
output, status = Open3.capture2('xcrun', 'simctl', 'create', 'Tune Into Her isolated release QA', 'com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro', 'com.apple.CoreSimulator.SimRuntime.iOS-26-5')
abort 'Owned simulator creation failed' unless status.success? && output.strip.match?(/\A[A-F0-9-]{36}\z/)
uuid = output.strip
File.write(File.join(root, 'owned-simulator.json'), JSON.pretty_generate({ 'createdForThisTask' => true, 'uuid' => uuid, 'physicalDevice' => false, 'appDataReset' => false }))
source = File.join(root, 'LaunchUIQA.swift')
swift = File.read(source)
old = '32C5B1E9-BE95-4BC1-8B76-4CE7D2A9979B'
guard = 'guard ProcessInfo.processInfo.environment["SIMULATOR_UDID"] == "' + old + '"'
abort 'Expected exactly one original guard' unless swift.scan(guard).length == 1
# A separately generated runner bound to its own newly created empty Simulator.
# The original runner's guard and source remain unchanged in the repository.
swift = swift.sub(guard, guard.sub(old, uuid)) + "\n" + File.read(File.join(__dir__, 'ReleaseSandboxQA.swift'))
File.write(source, swift)
puts JSON.generate({ 'ownedSimulator' => uuid, 'runner' => root, 'sourceRuntimeChanged' => false })
