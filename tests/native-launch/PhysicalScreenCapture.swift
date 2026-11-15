import Foundation
import CoreMediaIO
import AVFoundation
import CoreVideo
import Darwin

func writeJSON(_ object:[String:Any],_ path:String) {
  if let data=try? JSONSerialization.data(withJSONObject:object,options:[.prettyPrinted,.sortedKeys]) { try? data.write(to:URL(fileURLWithPath:path),options:.atomic) }
}
// Host-only QA tool; never add to a native app target. Device/source pin stays outside Git.
// Private diagnostic recorder only. PTS is monotonic HOST ARRIVAL time, not the
// device transport PTS. No frames are synthesized, interpolated or replayed.
final class ScreenRecorder:NSObject,AVCaptureVideoDataOutputSampleBufferDelegate {
  let session=AVCaptureSession(), video=AVCaptureVideoDataOutput()
  let queue=DispatchQueue(label:"tih.pinned.screen.writer",qos:.userInitiated)
  let pin:[String:String],output:String,ready:String,result:String,duration:Double
  var writer:AVAssetWriter?,writerInput:AVAssetWriterInput?,adaptor:AVAssetWriterInputPixelBufferAdaptor?
  var watchdog:DispatchWorkItem?,finished=false,stopping=false,recording=false
  var waitForUnlock=false,inputPorts:[String]=[],sourceFormats:[[String:Any]]=[],stages:[[String:Any]]=[]
  var observers:[NSObjectProtocol]=[]
  var baseHost:CMTime?,lastHostPTS:CMTime = .invalid,firstSourcePTS:CMTime?,lastSourcePTS:CMTime?
  var dimensions:[Int]=[],sourceFrames=0,appendedFrames=0,backpressureDrops=0,deviceDrops=0,sourceNonIncreasingPTS=0
  var sourceGapMax=0.0,hostGapMax=0.0
  func note(_ phase:String) {
    stages.append(["phase":phase,"uptime":ProcessInfo.processInfo.systemUptime])
    let connections=video.connections.map { connection -> [String:Any] in
      ["inputMediaTypes":connection.inputPorts.map{$0.mediaType.rawValue},"enabled":connection.isEnabled,"active":connection.isActive]
    }
    writeJSON(["phase":phase,"stages":stages,"sessionRunning":session.isRunning,"recording":recording,"inputPortMediaTypes":inputPorts,"outputConnections":connections,"sourceFormats":sourceFormats,"dimensions":dimensions,"sourceFrames":sourceFrames,"appendedFrames":appendedFrames,"backpressureDrops":backpressureDrops,"captureDelegateDrops":deviceDrops,"timestampSource":"monotonic host arrival, not device PTS","sourceNonIncreasingPTS":sourceNonIncreasingPTS,"sourceGapMaxSeconds":sourceGapMax,"hostGapMaxSeconds":hostGapMax,"videoAuthorizationStatus":AVCaptureDevice.authorizationStatus(for:.video).rawValue],result+".graph.private.json")
  }
  init(_ arguments:[String]) throws {
    guard (arguments.count==7 || arguments.count==8),arguments[1]=="--record-pinned-screen",let seconds=Double(arguments[4]),seconds>=15,seconds<=40 else { throw NSError(domain:"CaptureGuard",code:1,userInfo:[NSLocalizedDescriptionKey:"Use --record-pinned-screen <private-pin> <new-output.mov> <15..40seconds> <ready.json> <result.json>"]) }
    guard let parsed=try JSONSerialization.jsonObject(with:Data(contentsOf:URL(fileURLWithPath:arguments[2]))) as? [String:String],
      ["sourceUniqueID","knownPhoneUDID","knownCoreDeviceID","expectedName"].allSatisfy({parsed[$0]?.isEmpty == false})
    else {throw NSError(domain:"CaptureGuard",code:2,userInfo:nil)}
    pin=parsed
    output=arguments[3];duration=seconds;ready=arguments[5];result=arguments[6]
    waitForUnlock=arguments.count==8 && arguments[7]=="--wait-for-unlock"
    guard arguments.count==7 || waitForUnlock else {throw NSError(domain:"CaptureGuard",code:7,userInfo:nil)}
    let paths=[output,ready,result,result+".graph.private.json"].map {
      URL(fileURLWithPath:$0).standardizedFileURL.resolvingSymlinksInPath().path
    }
    guard Set(paths).count==paths.count,paths.allSatisfy({
      ($0.hasPrefix("/tmp/") || $0.hasPrefix("/private/tmp/")) && !FileManager.default.fileExists(atPath:$0)
    }) else {throw NSError(domain:"CaptureGuard",code:2,userInfo:nil)}
  }
  func verifyPhone() throws {
    let file=URL(fileURLWithPath:result).deletingLastPathComponent().appendingPathComponent("capture-current-device.private.json").path
    let task=Process();task.executableURL=URL(fileURLWithPath:"/usr/bin/xcrun");task.arguments=["devicectl","list","devices","--timeout","8","--json-output",file]
    let pipe=Pipe();task.standardOutput=pipe;task.standardError=pipe;try task.run();task.waitUntilExit()
    guard task.terminationStatus==0 else {throw NSError(domain:"CoreDeviceUnavailable",code:Int(task.terminationStatus),userInfo:nil)}
    let root=try JSONSerialization.jsonObject(with:Data(contentsOf:URL(fileURLWithPath:file))) as! [String:Any]
    let values=(root["result"] as! [String:Any])["devices"] as! [[String:Any]]
    let matches=values.filter{ ($0["hardwareProperties"] as? [String:Any])?["udid"] as? String == pin["knownPhoneUDID"] }
    guard matches.count==1,let connection=matches[0]["connectionProperties"] as? [String:Any],connection["tunnelState"] as? String=="connected",connection["transportType"] as? String=="wired" else {throw NSError(domain:"KnownWiredPhoneUnavailable",code:3,userInfo:nil)}
    note("PHONE_WIRED_VERIFIED")
    let deadline=ProcessInfo.processInfo.systemUptime+(waitForUnlock ? 120:0)
    repeat {
      let began=ProcessInfo.processInfo.systemUptime
      let lockFile=URL(fileURLWithPath:result).deletingLastPathComponent().appendingPathComponent("capture-lock-current.private.json").path
      let lock=Process();lock.executableURL=URL(fileURLWithPath:"/usr/bin/xcrun");lock.arguments=["devicectl","device","info","lockState","--device",pin["knownCoreDeviceID"]!,"--timeout","8","--json-output",lockFile]
      let pipe=Pipe();lock.standardOutput=pipe;lock.standardError=pipe;try lock.run();lock.waitUntilExit()
      guard lock.terminationStatus==0 else {throw NSError(domain:"LockStateUnavailable",code:Int(lock.terminationStatus),userInfo:nil)}
      let state=try JSONSerialization.jsonObject(with:Data(contentsOf:URL(fileURLWithPath:lockFile))) as! [String:Any]
      let values=state["result"] as! [String:Any]
      if values["passcodeRequired"] as? Bool==false {note("PHONE_UNLOCK_VERIFIED");return}
      note("WAITING_FOR_OWNER_UNLOCK")
      guard waitForUnlock,ProcessInfo.processInfo.systemUptime<deadline else {throw NSError(domain:"BlockedByPhoneLock",code:10,userInfo:[NSLocalizedDescriptionKey:"Known phone requires its owner to unlock it; no capture started"]) }
      Thread.sleep(forTimeInterval:max(0,1-(ProcessInfo.processInfo.systemUptime-began)))
    } while ProcessInfo.processInfo.systemUptime<deadline
    throw NSError(domain:"BlockedByPhoneLock",code:10,userInfo:[NSLocalizedDescriptionKey:"120-second owner-unlock wait ended; no capture started"])
  }
  func fail(_ error:Error) {
    guard !finished else{return};finished=true;stopping=true;watchdog?.cancel();recording=false
    writer?.cancelWriting();note("FAILED")
    let e=error as NSError
    writeJSON(["stage":"failed","domain":e.domain,"code":e.code,"captureSource":"pinned wired iOS muxed screen; no camera source selected","description":e.localizedDescription,"finishedSuccessfully":false,"errorCode":e.code,"cameraSource":false,"timestampSource":"monotonic host arrival, not device PTS","appendedFrames":appendedFrames,"backpressureDrops":backpressureDrops,"captureDelegateDrops":deviceDrops],result)
    DispatchQueue.global(qos:.utility).async { self.session.stopRunning();exit(1) }
  }
  func begin() {
    queue.async { [self] in
      do {
        note("VERIFY_PHONE_BEGIN");try verifyPhone()
        let timeout=DispatchWorkItem { [weak self] in self?.fail(NSError(domain:"CaptureStartTimeout",code:6,userInfo:[NSLocalizedDescriptionKey:"No actual pixel frame within20seconds after confirmed unlock"])) }
        watchdog=timeout;queue.asyncAfter(deadline:.now()+20,execute:timeout)
        var address=CMIOObjectPropertyAddress(mSelector:CMIOObjectPropertySelector(kCMIOHardwarePropertyAllowScreenCaptureDevices),mScope:CMIOObjectPropertyScope(kCMIOObjectPropertyScopeGlobal),mElement:CMIOObjectPropertyElement(kCMIOObjectPropertyElementMain));var allow:UInt32=1
        let status=CMIOObjectSetPropertyData(CMIOObjectID(kCMIOObjectSystemObject),&address,0,nil,UInt32(MemoryLayout<UInt32>.size),&allow)
        guard status==0 else {throw NSError(domain:"CMIOProcessDiscovery",code:Int(status),userInfo:nil)}
        note("CMIO_SCREEN_DISCOVERY_ENABLED");Thread.sleep(forTimeInterval:1.75)
        var sources:[AVCaptureDevice]=[]
        for _ in 0..<12 {
          sources=DispatchQueue.main.sync {
            var available:[AVCaptureDevice]=[]
            for type in [AVMediaType.video,AVMediaType.muxed] {
              for device in AVCaptureDevice.devices(for:type) where !available.contains(where:{$0.uniqueID==device.uniqueID}) {available.append(device)}
            }
            return available.filter{$0.uniqueID==pin["sourceUniqueID"] && $0.localizedName==pin["expectedName"] && $0.modelID=="iOS Device" && $0.hasMediaType(.muxed) && !$0.hasMediaType(.video) && $0.isConnected && !$0.deviceType.rawValue.lowercased().contains("continuity")}
          }
          if sources.count==1 {break};Thread.sleep(forTimeInterval:0.25)
        }
        guard sources.count==1 else {throw NSError(domain:"PinnedScreenSourceUnavailable",code:4,userInfo:nil)}
        // Retain the original pin/wired/unlocked guard. No requestAccess, TCC
        // changes, source fallback, device commands or UI automation occurs here.
        sourceFormats=sources[0].formats.map { format in
          ["mediaType":format.mediaType.rawValue,"formatMediaType":CMFormatDescriptionGetMediaType(format.formatDescription),"codecSubtype":CMFormatDescriptionGetMediaSubType(format.formatDescription)] as [String:Any]
        }
        note("SCREEN_INPUT_CREATING")
        let input=try AVCaptureDeviceInput(device:sources[0]);inputPorts=input.ports.map{$0.mediaType.rawValue};note("SCREEN_INPUT_CREATED")
        session.beginConfiguration()
        guard session.canAddInput(input),session.canAddOutput(video) else {throw NSError(domain:"CaptureVideoGraph",code:5,userInfo:nil)}
        session.addInput(input)
        video.videoSettings=[kCVPixelBufferPixelFormatTypeKey as String:kCVPixelFormatType_32BGRA]
        video.alwaysDiscardsLateVideoFrames=true
        video.setSampleBufferDelegate(self,queue:queue)
        session.addOutput(video)
        // A video-data output exposes only video, avoiding movie muxing of
        // captions/audio/metadata and its independent sample/timestamp limits.
        guard let connection=video.connection(with:.video),connection.inputPorts.contains(where:{$0.mediaType == .video}) else {throw NSError(domain:"VideoConnectionUnavailable",code:11,userInfo:nil)}
        session.commitConfiguration();note("GRAPH_CONFIGURED")
        observers.append(NotificationCenter.default.addObserver(forName:.AVCaptureSessionRuntimeError,object:session,queue:nil) { [weak self] notification in
          guard let self else{return};self.queue.async {
            guard !self.stopping else{return}
            self.fail(notification.userInfo?[AVCaptureSessionErrorKey] as? Error ?? NSError(domain:"CaptureSessionRuntimeError",code:12,userInfo:nil))
          }
        })
        note("SESSION_STARTING");session.startRunning();note("SESSION_RUNNING")
      } catch {fail(error)}
    }
  }
  func prepareWriter(_ pixel:CVPixelBuffer) throws {
    let width=CVPixelBufferGetWidth(pixel),height=CVPixelBufferGetHeight(pixel)
    guard width>0,height>0,width<=4096,height<=4096 else {throw NSError(domain:"UnexpectedPixelDimensions",code:13,userInfo:nil)}
    dimensions=[width,height]
    let target=try AVAssetWriter(outputURL:URL(fileURLWithPath:output),fileType:.mov)
    target.shouldOptimizeForNetworkUse=true;target.metadata=[]
    let compression:[String:Any]=[AVVideoAverageBitRateKey:12_000_000,AVVideoProfileLevelKey:AVVideoProfileLevelH264HighAutoLevel,AVVideoAllowFrameReorderingKey:false,AVVideoExpectedSourceFrameRateKey:60,AVVideoMaxKeyFrameIntervalKey:60]
    let settings:[String:Any]=[AVVideoCodecKey:AVVideoCodecType.h264,AVVideoWidthKey:width,AVVideoHeightKey:height,AVVideoCompressionPropertiesKey:compression]
    let input=AVAssetWriterInput(mediaType:.video,outputSettings:settings);input.expectsMediaDataInRealTime=true;input.mediaTimeScale=60000
    let pixels=AVAssetWriterInputPixelBufferAdaptor(assetWriterInput:input,sourcePixelBufferAttributes:[kCVPixelBufferPixelFormatTypeKey as String:kCVPixelFormatType_32BGRA,kCVPixelBufferWidthKey as String:width,kCVPixelBufferHeightKey as String:height])
    guard target.canAdd(input) else {throw NSError(domain:"WriterVideoInputUnavailable",code:14,userInfo:nil)}
    target.add(input)
    guard target.startWriting() else {throw target.error ?? NSError(domain:"WriterStartFailed",code:15,userInfo:nil)}
    target.startSession(atSourceTime:.zero)
    writer=target;writerInput=input;adaptor=pixels
  }
  func captureOutput(_ output:AVCaptureOutput,didOutput sample:CMSampleBuffer,from connection:AVCaptureConnection) {
    guard !stopping,!finished else{return};sourceFrames+=1
    guard CMSampleBufferDataIsReady(sample),let pixel=CMSampleBufferGetImageBuffer(sample) else {fail(NSError(domain:"NoDecodedPixelBuffer",code:16,userInfo:nil));return}
    let sourcePTS=CMSampleBufferGetPresentationTimeStamp(sample)
    if sourcePTS.isNumeric {
      if firstSourcePTS == nil {firstSourcePTS=sourcePTS}
      if let previous=lastSourcePTS {
        let delta=CMTimeGetSeconds(CMTimeSubtract(sourcePTS,previous));if delta<=0 {sourceNonIncreasingPTS+=1};if delta.isFinite {sourceGapMax=max(sourceGapMax,delta)}
      }
      lastSourcePTS=sourcePTS
    }
    let arrival=CMClockGetTime(CMClockGetHostTimeClock())
    do {
      if writer == nil {try prepareWriter(pixel);baseHost=arrival}
      guard dimensions == [CVPixelBufferGetWidth(pixel),CVPixelBufferGetHeight(pixel)] else {throw NSError(domain:"ScreenFormatChanged",code:17,userInfo:[NSLocalizedDescriptionKey:"Screen pixel dimensions changed; recording rejected rather than silently resized"])}
      guard let input=writerInput,let pixels=adaptor,let base=baseHost else {throw NSError(domain:"WriterNotReady",code:18,userInfo:nil)}
      let pts=CMTimeConvertScale(CMTimeSubtract(arrival,base),timescale:60000,method:.roundTowardZero)
      if lastHostPTS.isNumeric {
        guard CMTimeCompare(pts,lastHostPTS)>0 else {throw NSError(domain:"HostClockNotIncreasing",code:19,userInfo:nil)}
        hostGapMax=max(hostGapMax,CMTimeGetSeconds(CMTimeSubtract(pts,lastHostPTS)))
      }
      guard input.isReadyForMoreMediaData else {backpressureDrops+=1;return}
      guard pixels.append(pixel,withPresentationTime:pts) else {throw writer?.error ?? NSError(domain:"WriterAppendFailed",code:20,userInfo:nil)}
      lastHostPTS=pts;appendedFrames+=1
      if !recording {
        recording=true;watchdog?.cancel();note("FIRST_PIXEL_APPENDED")
        writeJSON(["stage":"recording","startedAtUTC":ISO8601DateFormatter().string(from:Date()),"knownPhoneWiredChecked":true,"opaqueScreenUIDPinned":true,"sourceModel":"iOS Device","sourceMuxed":true,"cameraSource":false,"durationLimitSeconds":duration,"videoAuthorizationStatus":AVCaptureDevice.authorizationStatus(for:.video).rawValue,"timestampSource":"monotonic host arrival, not device PTS","readyMeans":"first actual video pixel buffer appended","width":dimensions[0],"height":dimensions[1]],ready)
        let end=DispatchWorkItem { [weak self] in self?.finish("boundedHostTimer") };watchdog=end;queue.asyncAfter(deadline:.now()+duration,execute:end)
      }
    } catch {fail(error)}
  }
  func captureOutput(_ output:AVCaptureOutput,didDrop sampleBuffer:CMSampleBuffer,from connection:AVCaptureConnection) {deviceDrops+=1}
  func finish(_ reason:String) {
    guard !finished,!stopping else{return};stopping=true;watchdog?.cancel()
    guard recording,let writer,let input=writerInput,let base=baseHost else {fail(NSError(domain:"StoppedBeforeFirstPixel",code:21,userInfo:nil));return}
    let end=CMTimeSubtract(CMClockGetTime(CMClockGetHostTimeClock()),base)
    input.markAsFinished();writer.endSession(atSourceTime:end)
    note("WRITER_FINISHING")
    writer.finishWriting { [self] in queue.async { [self] in
      guard !finished else{return}
      guard writer.status == .completed,writer.error == nil else {fail(writer.error ?? NSError(domain:"WriterFinishFailed",code:22,userInfo:nil));return}
      finished=true;recording=false;note("WRITER_COMPLETED")
      writeJSON(["stage":"complete","fileExists":FileManager.default.fileExists(atPath:output),"durationLimitSeconds":duration,"errorDomain":"","errorCode":0,"finishedSuccessfully":true,"cameraSource":false,"finishReason":reason,"timestampSource":"monotonic host arrival, not device PTS","framesSynthesized":false,"audioRecorded":false,"appendedFrames":appendedFrames,"sourceFrames":sourceFrames,"backpressureDrops":backpressureDrops,"captureDelegateDrops":deviceDrops,"sourceNonIncreasingPTS":sourceNonIncreasingPTS,"sourceGapMaxSeconds":sourceGapMax,"hostGapMaxSeconds":hostGapMax,"hostElapsedSeconds":CMTimeGetSeconds(end),"width":dimensions[0],"height":dimensions[1]],result)
      DispatchQueue.global(qos:.utility).async {self.session.stopRunning();exit(0)}
    } }
  }
  func stop() {queue.async {self.finish("interrupt")}}
}
var recorder:ScreenRecorder?
do {recorder=try ScreenRecorder(CommandLine.arguments);recorder!.begin()} catch {fputs("Capture argument guard failed\n",stderr);exit(2)}
signal(SIGINT,SIG_IGN);let interrupt=DispatchSource.makeSignalSource(signal:SIGINT,queue:.main);interrupt.setEventHandler{recorder?.stop()};interrupt.resume()
RunLoop.main.run()
