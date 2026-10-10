# Offline Android AI Voice Assistant --- `plan.md`

> **Project goal:** Build a fully offline, voice-first Android assistant
> for an iQOO Neo 10R. The assistant listens to English speech, reasons
> with a local LLM, speaks naturally using Kokoro, and eventually
> performs approved phone actions through a safe tool registry.
>
> **Implementation style:** Build and test one vertical slice at a time.
> Do not build every subsystem simultaneously. Verify current model
> files, licences, runtime compatibility, and Android API constraints
> before integrating them.

------------------------------------------------------------------------

## 0. Requirements and decisions

### Device and constraints

-   Phone: iQOO Neo 10R
-   RAM: 8 GB
-   Internal storage: 256 GB total; approximately 126 GB currently
    available
-   Primary language: English only for the initial release
-   Priority: balanced latency, voice quality, and model capability
-   Inference: local/offline; no paid cloud inference APIs
-   UI: React Native + Expo development build + TypeScript
-   Native Android: Kotlin
-   Existing developer setup: Android Studio, Android SDK/ADB, JDK 17,
    Expo prebuild and Android development builds already work on the
    user's machine and phone. Do not repeat environment installation
    unless diagnostics show it is broken.
-   Model storage: downloaded on demand; never bundle large model
    binaries into the APK.
-   Future requirements: model add/remove/switching, safe tool calling,
    Quick Settings activation, notification shortcut, and optional
    wake-word activation.

### User-facing activation modes

1.  **In-app microphone button** --- available in the first voice
    release.
2.  **Quick Settings tile called "Talk to AI"** --- a system-level
    button to start a voice session without navigating through the main
    app UI.
3.  **Optional notification action** --- a visible "Talk" action when
    the assistant notification is available.
4.  **Future wake word** --- optional, local keyword spotting. Do not
    implement until the push-to-talk pipeline is reliable.

The Quick Settings button should open a minimal, lightweight capture
activity, not the main React Native screen. The activity should show
that listening is active and offer a clear stop/cancel action. Start
microphone capture only after the user has explicitly initiated the
interaction and the app has satisfied Android's permission and
foreground-service requirements.

Do not assume Android permits arbitrary background microphone starts.
Background microphone and foreground-service rules differ by Android
version. Verify the current rules for the project's target SDK and test
on the actual phone.

### Non-goals for the first version

-   Always-on listening
-   Wake word
-   Arbitrary shell commands
-   Unrestricted accessibility automation
-   Multiple LLMs loaded into RAM simultaneously
-   Cloud fallback
-   Automatic upload of audio, transcripts, or conversations
-   Building a model marketplace with dozens of models before one model
    works reliably

------------------------------------------------------------------------

## 1. Recommended initial stack

  ------------------------------------------------------------------------
  Layer                   Initial candidate        Responsibility
  ----------------------- ------------------------ -----------------------
  Mobile UI               React Native, Expo       Chat, in-app
                          development build,       microphone, settings,
                          TypeScript               model library

  Native integration      Kotlin                   Audio lifecycle, native
                                                   runtime bridges,
                                                   Android tools

  LLM                     Qwen3-1.7B GGUF, begin   Local conversation and
                          with a verified Q4_K_M   future tool selection
                          build                    

  LLM runtime             llama.cpp Android        Load and run compatible
                          integration              GGUF models

  STT                     Whisper `base.en` or     English speech-to-text
                          `tiny.en` in             
                          whisper.cpp-compatible   
                          format                   

  STT runtime             whisper.cpp Android      Local transcription
                          example/integration      

  TTS                     Kokoro-82M ONNX          Natural English speech
                                                   generation

  TTS Android integration `kokoro-android`         Kotlin API around
  candidate                                        Kokoro ONNX, ONNX
                                                   Runtime and espeak-ng

  Metadata                SQLite                   Model catalogue,
                                                   installed models,
                                                   settings, conversation
                                                   history

  Large files             App-private files        Downloaded model
                          directory                weights and supporting
                                                   assets

  System activation       Android `TileService`    Quick Settings "Talk to
                          plus lightweight         AI" entry point
                          Activity                 

  Future activation       Local wake-word detector Optional hands-free
                                                   start

  Tool execution          Explicit Kotlin tool     Safe, validated Android
                          registry                 actions
  ------------------------------------------------------------------------

### Primary technical references

-   llama.cpp Android guide:
    https://github.com/ggml-org/llama.cpp/blob/master/docs/android.md
-   Qwen3-1.7B GGUF: https://huggingface.co/Qwen/Qwen3-1.7B-GGUF
-   whisper.cpp Android example:
    https://github.com/ggml-org/whisper.cpp/tree/master/examples/whisper.android
-   Whisper model documentation:
    https://github.com/ggml-org/whisper.cpp/tree/master/models
-   Kokoro Android integration candidate:
    https://github.com/ffmpegkit-maintained/kokoro-android
-   Kokoro model: https://huggingface.co/hexgrad/Kokoro-82M
-   Android Quick Settings TileService:
    https://developer.android.com/reference/android/service/quicksettings/TileService
-   Android foreground-service restrictions:
    https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start
-   Android foreground-service types:
    https://developer.android.com/develop/background-work/services/fgs/service-types

Repository contents, versions and APIs change. Check current upstream
documentation before copying dependencies or code.

------------------------------------------------------------------------

## 2. Model selection and compatibility

### 2.1 LLM: Qwen3-1.7B

Initial candidate: Qwen3-1.7B with a verified Q4_K_M GGUF conversion.

Official upstream model repository:
https://huggingface.co/Qwen/Qwen3-1.7B-GGUF

The upstream model specifies Apache-2.0 licensing. Check the exact file
and repository revision that you download. Prefer a verifiable source
and pin a revision/checksum.

#### Why start here?

-   Small enough to be a reasonable first LLM for an 8 GB device.
-   Can be run using a local GGUF runtime if the selected model
    architecture is supported.
-   Suitable for testing the complete local pipeline before exploring
    larger models.
-   Provides a starting point for future structured tool-selection
    experiments.

#### Compatibility checklist

Before downloading or integrating a particular file, verify:

-   It is a valid GGUF file and the expected Qwen architecture.
-   The selected llama.cpp version supports that architecture.
-   Tokenizer and chat template are correct.
-   Quantization is actually Q4_K_M (or the exact quantization claimed).
-   Provenance and SHA-256 checksum are known.
-   Licence is verified for the exact release.
-   The file can be loaded from app-private storage.
-   Memory use is measured with the intended context size.
-   Tool-call formatting is tested independently; do not assume tool
    calling is reliable merely because ordinary chat works.

Begin with a context window around 2,048 tokens. Test 4,096 only if
performance and memory use are acceptable. Keep one LLM loaded by
default.

Do not hardcode a model download URL or checksum until it has been
verified. Do not commit model binaries to Git.

### 2.2 STT: English-only Whisper

Use whisper.cpp and compare:

-   `tiny.en`: faster and smaller baseline.
-   `base.en`: potentially better recognition, but more compute and
    memory.

Start with `tiny.en` to prove the integration, then benchmark `base.en`
using the same audio clips. Choose the model that offers the best
practical balance on the phone.

Compatibility checklist:

-   Use a model file in the format expected by the selected whisper.cpp
    version.
-   Verify the English-only model variant is selected.
-   Confirm the audio sample rate, channel count, PCM representation and
    buffer format.
-   Confirm the native library is built for the phone's ABI, normally
    `arm64-v8a`.
-   Test microphone permission, recording start/stop and cancellation.
-   Test with real speech, background noise, app names and technical
    vocabulary.
-   Verify offline operation with network access disabled.
-   Measure transcription latency for fixed 5- and 10-second recordings.

Do not copy model weights into APK assets for production. The upstream
sample may use assets for demonstration, but this project must support
on-demand model management from app-private storage.

### 2.3 TTS: Kokoro-82M ONNX

Primary TTS candidate: Kokoro-82M.

-   Model repository: https://huggingface.co/hexgrad/Kokoro-82M
-   Android integration candidate:
    https://github.com/ffmpegkit-maintained/kokoro-android

The cited Android integration documents an ONNX-based native path, 24
kHz mono output, and an English `af_heart` voice in its free
configuration. Verify its current release, model expectations, API, and
licensing before integration.

#### Important licensing distinction

Kokoro model weights are described as Apache-2.0, but the Android
integration also uses espeak-ng for phonemization. Its repository
documents espeak-ng as a separate GPL-3.0 component. The overall app's
distribution/licensing obligations must be reviewed before
redistribution, especially if a permissive licence for every dependency
is mandatory. Do not assume the model's licence covers the entire
runtime stack.

#### TTS compatibility checklist

-   Confirm the exact ONNX model file and expected model version.
-   Confirm the Android library version and API signatures.
-   Confirm the required voice embedding/style files are available and
    licensed.
-   Confirm espeak-ng phoneme data is packaged or extracted correctly.
-   Confirm ABI support (`arm64-v8a`) and minimum Android API.
-   Run synthesis on a background coroutine/thread.
-   Test audio playback with Android `AudioTrack` or the API recommended
    by the integration.
-   Confirm the audio sample rate, channel count and PCM format expected
    by playback.
-   Release native memory when the voice engine is unloaded.
-   Test English questions, numbers, abbreviations, technical terms, and
    long responses.
-   Test interruption while speech is playing.

Keep the TTS engine behind a stable adapter so another model can replace
Kokoro later without changing the chat UI.

### 2.4 Runtime compatibility is explicit

Do not assume one runtime can load all model formats:

-   llama.cpp: compatible GGUF language models.
-   whisper.cpp: Whisper model files converted/formatted for
    whisper.cpp.
-   Kokoro Android: the ONNX model and voice assets expected by the
    chosen library.
-   Wake-word model: a format supported by the selected keyword-spotting
    runtime.

Every model catalogue entry must identify its runtime, format, version,
supporting files and licence.

------------------------------------------------------------------------

## 3. Architecture

Use this flow:

``` text
In-app mic button ───────────────┐
                                 │
Quick Settings “Talk to AI”      │
       ↓                         │
Minimal capture Activity         │
       ↓                         │
Native audio capture             │
       └──────────────┬──────────┘
                      ↓
                STT (Whisper)
                      ↓
               Transcript text
                      ↓
             Conversation engine
                      ↓
                 Local LLM
                 ↙       ↘
          Text response   Tool request
                 ↓            ↓
                TTS      Validate tool
                 ↓            ↓
              Playback   Kotlin tool registry
                              ↓
                         Actual result
                              ↓
                       LLM / spoken reply

Model Manager ──> model files, runtimes, licences, checksums
SQLite ─────────> catalogue, settings, history, installed-model metadata
```

### 3.1 React Native layer

Owns: - Chat screen and transcript display - In-app push-to-talk
button - Stop/cancel button - TTS playback state - Model catalogue
screen - Installed/loaded/active status - Download progress and deletion
confirmation - Settings and diagnostics - Tool confirmation UI

### 3.2 Kotlin/native layer

Owns: - Audio recording and playback lifecycle - LLM/STT/TTS native
adapters - Model load/unload operations - File integrity verification -
Quick Settings TileService - Lightweight capture Activity - Microphone
foreground-service integration when required - Registered Android
tools - Cancellation, errors and cleanup

### 3.3 Conversation engine

Use explicit states:

-   `IDLE`
-   `LISTENING`
-   `TRANSCRIBING`
-   `THINKING`
-   `WAITING_FOR_TOOL`
-   `SPEAKING`
-   `ERROR`

Every transition should have cancellation and cleanup handling. Do not
allow two simultaneous LLM generations or uncontrolled microphone/TTS
operations.

### 3.4 Native API boundary

Define a stable asynchronous interface. Example only; adapt it to the
actual native bridge:

``` ts
interface AssistantNativeModule {
  loadModel(modelId: string): Promise<void>;
  unloadModel(modelId: string): Promise<void>;
  transcribeAudio(): Promise<string>;
  generateResponse(prompt: string): Promise<string>;
  speakText(text: string): Promise<void>;
  stopSpeaking(): Promise<void>;
  getModelStatus(modelId: string): Promise<string>;
}
```

The real implementation should expose streaming events for
transcription, generated tokens, model loading, tool results, audio
playback and errors where useful.

Heavy inference must not run on the React Native JavaScript thread.

------------------------------------------------------------------------

## 4. Repository structure

Use a structure similar to this. Adjust paths to the existing Expo
project and native integration:

``` text
local-assistant/
├── app/
│   ├── index.tsx
│   ├── chat.tsx
│   ├── models.tsx
│   └── settings.tsx
├── src/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   │   ├── conversation.ts
│   │   ├── model-manager.ts
│   │   ├── speech.ts
│   │   └── tool-dispatcher.ts
│   ├── storage/
│   │   ├── database.ts
│   │   └── model-files.ts
│   └── types/
│       ├── model.ts
│       └── tools.ts
├── android/
│   └── app/src/main/java/<package-name>/
│       ├── LlmModule.kt
│       ├── SpeechRecognitionModule.kt
│       ├── SpeechSynthesisModule.kt
│       ├── ModelStorageModule.kt
│       ├── AssistantCaptureActivity.kt
│       ├── AssistantTileService.kt
│       └── ToolExecutionModule.kt
├── catalogue/
│   └── models.json
├── docs/
│   ├── architecture.md
│   └── model-licences.md
└── plan.md
```

Do not create all these files as empty stubs in one step. Add files when
the corresponding phase begins.

------------------------------------------------------------------------

## 5. Storage and model manager

The phone has approximately 126 GB currently available. Reserve a modest
initial model experimentation budget (for example, 15--20 GB) and retain
free space for Android and application data.

Suggested private storage:

``` text
files/
├── models/
│   ├── chat/
│   │   └── qwen3-1.7b-q4/
│   ├── stt/
│   │   ├── whisper-tiny-en/
│   │   └── whisper-base-en/
│   └── tts/
│       └── kokoro/
├── staging/
└── database/
    └── assistant.db
```

Actual Kokoro and STT supporting files may require additional
directories. Keep each model's files together as a managed unit.

### Required model states

-   **Available:** present in catalogue but not downloaded.
-   **Installed:** verified files exist on disk.
-   **Loaded:** runtime has allocated memory/resources for the model.
-   **Active:** selected for the task.

An installed model must not consume inference RAM simply because it
exists on disk.

### Model manifest

Use metadata such as:

``` ts
type ModelTask = "chat" | "stt" | "tts" | "wake-word";

type ModelFile = {
  name: string;
  sizeBytes: number;
  sha256: string;
  downloadUrl: string;
};

type ModelDefinition = {
  id: string;
  name: string;
  task: ModelTask;
  runtime: string;
  format: string;
  version: string;
  license: string;
  sourceUrl: string;
  files: ModelFile[];
};
```

The catalogue must contain actual verified sizes, hashes and URLs. Never
use placeholder checksums in production.

### Download lifecycle

1.  Check free disk space.
2.  Download into `staging/`.
3.  Show progress and support cancellation.
4.  Verify exact file size and SHA-256.
5.  Verify all required supporting files are present.
6.  Atomically move files into the installed directory.
7.  Update the database.
8.  Run a smoke test before enabling activation.

### Activation and deletion lifecycle

-   Check runtime compatibility before loading.
-   Load models off the UI thread.
-   Default to one loaded LLM at a time.
-   If memory is low, unload the current model before loading another.
-   Prevent deletion while a model is loaded.
-   On deletion, unload, delete files and update metadata.
-   Handle failed loads without marking the model active.
-   Keep model weights out of Git and out of the APK.

For the first version, use app-private storage. Add model import through
Android's Storage Access Framework later if required.

------------------------------------------------------------------------

## 6. Quick Settings "Talk to AI" button

### Desired behaviour

The user should be able to pull down Android Quick Settings, tap "Talk
to AI", speak a command, hear a response, and return to whatever they
were doing without navigating through the main app screen.

The main app must still have its own microphone button.

### Android design

Implement: - An Android `TileService` registered as a Quick Settings
tile. - A minimal `AssistantCaptureActivity` that displays a small
listening state and stop/cancel control. - A shared native assistant
session controller so both activation paths use the same STT → LLM → TTS
pipeline. - Optional notification action after the user has enabled the
relevant assistant session.

The tile should launch a lightweight capture Activity (or the
appropriate user-visible entry point), not navigate to the main React
Native screen. The Activity should start capture only after permissions
and Android lifecycle rules are satisfied. It may finish or become
non-intrusive after the session has safely started, depending on the
implementation and Android version.

Do not claim that a tile can silently start microphone capture on every
Android version. Implement the flow according to current Android
restrictions and test it on the actual phone.

### Permissions and lifecycle

-   Request `RECORD_AUDIO` at runtime.
-   Declare only the foreground-service permissions and service types
    actually needed for the chosen target SDK.
-   If microphone capture continues when the Activity is no longer
    visible, use a correctly declared microphone foreground service and
    persistent notification where required.
-   Start microphone capture from an allowed user-visible interaction.
-   Handle denied permissions with a clear explanation and fallback to
    in-app push-to-talk.
-   Stop capture and release audio resources immediately when the user
    cancels.
-   Do not keep the microphone running after a one-shot session unless
    the user explicitly enables a supported mode.

Relevant official documentation: - TileService:
https://developer.android.com/reference/android/service/quicksettings/TileService -
Background foreground-service restrictions:
https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start -
Foreground-service types:
https://developer.android.com/develop/background-work/services/fgs/service-types

### Acceptance criteria

-   The tile appears in Android Quick Settings after the user adds it.
-   Tapping it starts a visible, user-initiated voice session.
-   The main app does not have to be manually opened first.
-   The same conversation engine is used by the tile and the main app.
-   Permission denial and unsupported background start are handled
    gracefully.
-   The microphone stops when the session ends.
-   The feature is tested with the screen locked and unlocked, while
    respecting Android restrictions.

Build this after the in-app push-to-talk pipeline works.

------------------------------------------------------------------------

## 7. Future wake-word support

Wake-word detection is a later phase.

Possible future flow:

``` text
Low-cost local keyword detector
             ↓
       Wake word detected
             ↓
     Start voice interaction
             ↓
        Whisper STT
             ↓
         Local LLM
             ↓
      Tool or text response
             ↓
          Kokoro TTS
```

Investigate local keyword spotting in sherpa-onnx:
https://github.com/k2-fsa/sherpa-onnx

Before choosing a wake-word model, verify: - Model licence - Supported
Android runtime - Expected audio frame size/sample rate - False-trigger
and missed-trigger rates - Memory, CPU and battery cost - Background
execution constraints

Do not implement continuous wake-word listening in the first release.
First get push-to-talk and Quick Settings activation stable, then
prototype the detector while the app is visible, then investigate
supported background operation.

------------------------------------------------------------------------

## 8. Safe tool calling

The LLM must never directly execute arbitrary Android commands.

Use a strict registry with: - Tool name - Description - JSON argument
schema - Argument validation - Permission checks - Confirmation policy -
Native implementation - Timeout - Actual result or error

Initial tools: 1. Read battery status. 2. Read available storage. 3.
Open an allowlisted installed app. 4. Create and retrieve local notes.
5. Create reminders after validating date/time.

Example request:

``` json
{
  "name": "get_storage_status",
  "arguments": {}
}
```

The app validates the request, executes the native function, returns the
actual result, and only then allows the LLM to report success.

Reject unknown tools, malformed JSON, invalid arguments and unsupported
actions. Require confirmation for sensitive, destructive or externally
visible actions. Do not expose arbitrary shell access or unrestricted
accessibility control.

Test tool calling using real prompts, malformed outputs, ambiguous
requests and adversarial instructions. A model's ability to produce
valid JSON is not sufficient evidence that its tool selection is
reliable.

------------------------------------------------------------------------

## 9. Implementation walkthrough

Work one phase at a time. Do not move forward until the current phase
passes its acceptance tests.

### Phase 1 --- Local LLM proof of concept

**Goal:** type a prompt and receive a response offline on the phone.

1.  Reuse the existing Expo development-build project.
2.  Check that the existing Android build still works; do not reinstall
    Android Studio or the SDK without a reason.
3.  Review the official llama.cpp Android example.
4.  Select and verify one Qwen3-1.7B GGUF model.
5.  Run the official native example first if it is the fastest way to
    verify inference on the device.
6.  Integrate the runtime into the app only after the standalone proof
    works.
7.  Store the model in app-private storage.
8.  Start with a context window around 2,048 tokens.
9.  Add a minimal chat screen and native asynchronous generation API.
10. Test in airplane mode.
11. Record cold-load time, time to first token, generation speed, memory
    use and stability.
12. Test 20 consecutive prompts and a ten-turn conversation.

**Done when:** reliable local text chat works on the actual phone
without a network connection.

### Phase 2 --- In-app push-to-talk and STT

**Goal:** speak English and see a transcript.

1.  Add a microphone button to the chat screen.
2.  Request microphone permission.
3.  Capture PCM audio using Android's audio APIs.
4.  Integrate whisper.cpp using its official Android example as a
    reference.
5.  Start with `tiny.en`.
6.  Convert/copy the audio to the format expected by the selected
    runtime.
7.  Run transcription off the UI thread.
8.  Display the transcript.
9.  Add recording cancellation and error handling.
10. Compare `tiny.en` with `base.en` using the same 20--30 recordings.
11. Measure accuracy and transcription latency.
12. Test offline operation.

**Done when:** the user can tap, speak, see a transcript, and cancel
recording reliably.

### Phase 3 --- Kokoro TTS

**Goal:** synthesize and play English responses offline.

1.  Review the current `kokoro-android` repository and API.
2.  Verify its current Android dependency coordinates, release version
    and licence.
3.  Obtain the matching Kokoro ONNX model and required voice assets.
4.  Verify the model and voice asset hashes.
5.  Integrate the Kotlin API or its library through the Android project.
6.  Initialize the model from a managed local file path.
7.  Run synthesis on a coroutine/background thread.
8.  Play the returned audio using the recommended Android audio API.
9.  Add Stop and cancellation controls.
10. Test pronunciation, pacing, numbers, technical words and long
    responses.
11. Measure synthesis time and memory.
12. Release the native TTS resources when unloading.

**Done when:** the app speaks a fixed test sentence in airplane mode
without blocking the UI.

### Phase 4 --- Complete voice pipeline

**Goal:** tap microphone → speak → receive an LLM answer → hear Kokoro.

1.  Connect the final STT transcript to the LLM.
2.  Add a system prompt that asks for concise, conversational English.
3.  Keep recent conversation history within a bounded context.
4.  Send generated responses to Kokoro.
5.  Implement the conversation state machine.
6.  Add Stop/cancel handling across STT, LLM and TTS.
7.  Prevent overlapping inference requests.
8.  Add sentence-based TTS streaming only after whole-response synthesis
    is reliable.
9.  Verify all stages work offline.
10. Measure time from speech completion to first audible response.

**Done when:** a full voice conversation works offline and recovers from
cancellation and errors.

### Phase 5 --- Model manager

**Goal:** install, activate, unload and delete models without
reinstalling the app.

1.  Create the model manifest and catalogue.
2.  Add the SQLite schema.
3.  Implement storage accounting.
4.  Implement download to a staging directory.
5.  Verify checksums and required files.
6.  Move completed models into the installed directory.
7.  Add Installed, Loaded and Active states.
8.  Add activation and unloading.
9.  Prevent deletion of active models.
10. Add deletion and cleanup.
11. Add compatibility checks and licence display.
12. Test interrupted downloads, low storage and failed model loading.

**Done when:** the LLM, STT model and TTS voice can be managed
independently.

### Phase 6 --- Quick Settings activation

**Goal:** tap "Talk to AI" in Quick Settings without navigating through
the main app.

1.  Implement the native `TileService`.
2.  Register it in the Android manifest with the correct intent filter
    and metadata.
3.  Add the Quick Settings tile resource and label.
4.  Implement `AssistantCaptureActivity`.
5.  Make the tile launch the lightweight Activity.
6.  Reuse the same assistant session controller used by the main app.
7.  Request microphone permission in a user-visible flow.
8.  Implement the correctly declared foreground service only if required
    for the session lifecycle.
9.  Add visible listening status and stop/cancel controls.
10. Handle background-start restrictions and permission denial.
11. Test the tile with the app process alive and after the app has been
    swiped away.
12. Verify that the main app microphone button continues to work.

**Done when:** a tile tap starts the same assistant session without
requiring the main app UI to be navigated to.

### Phase 7 --- Safe tools

**Goal:** the LLM can request a few controlled Android actions.

1.  Implement a tool registry.
2.  Add strict JSON schemas and argument validators.
3.  Add read-only battery and storage tools.
4.  Add opening an allowlisted application.
5.  Add local notes.
6.  Add reminders after date/time validation.
7.  Return actual execution results to the LLM.
8.  Add confirmation and error handling.
9.  Test malformed and adversarial tool requests.
10. Keep all actions offline unless a specific future feature explicitly
    requires network access.

**Done when:** tool requests are validated and only registered actions
execute.

### Phase 8 --- Optional wake word

**Goal:** start the assistant by speaking a configured wake word.

1.  Select a compatible, licensed keyword-spotting model.
2.  Test it while the app is visible.
3.  Measure false positives, missed detections, CPU and battery use.
4.  Start the voice pipeline only after a detection.
5.  Add explicit enable/disable controls.
6.  Investigate supported background microphone operation and
    foreground-service requirements.
7.  Test screen-off, locked-screen and OEM battery-management behaviour.
8.  Keep the Quick Settings tile and in-app microphone as fallbacks.

**Done when:** the optional wake word works within documented Android
restrictions and has acceptable false-trigger and battery behaviour.

------------------------------------------------------------------------

## 10. Suggested tests and acceptance criteria

  -----------------------------------------------------------------------
  Test                                Initial target
  ----------------------------------- -----------------------------------
  Offline operation                   Full STT → LLM → TTS pipeline works
                                      in airplane mode

  LLM reliability                     20 consecutive prompts without a
                                      crash

  Speech recognition                  20--30 fixed English phrases tested
                                      repeatedly

  TTS quality                         At least two supported voice
                                      configurations compared if
                                      available

  Model switching                     Change models without reinstalling
                                      the app

  Model deletion                      Unloaded model deleted and disk
                                      space released

  Tool safety                         Unknown tools and invalid arguments
                                      rejected

  Quick Settings                      Tile starts a user-visible session
                                      without navigating through the main
                                      app UI

  Cancellation                        Recording, generation and playback
                                      stop safely

  Sustained use                       10--15 minutes of repeated
                                      interaction without unacceptable
                                      thermal or stability problems

  Recovery                            Failed model load and process
                                      termination leave valid model
                                      metadata
  -----------------------------------------------------------------------

These are proposed acceptance tests, not guaranteed performance claims.

------------------------------------------------------------------------

## 11. Security, privacy and Android restrictions

-   All normal inference must be local.
-   Model downloads may use the network only when the user requests
    installation or updates.
-   Do not upload transcripts, audio or conversation history.
-   Display microphone activity clearly.
-   Stop recording immediately on cancellation.
-   Respect runtime microphone permission and Android foreground-service
    rules.
-   Do not assume a background service can start microphone capture at
    any arbitrary time.
-   Do not claim tool success before native execution confirms it.
-   Require confirmation for sensitive actions.
-   Do not execute arbitrary shell commands.
-   Verify all model and voice licences.
-   Verify model checksums and provenance.
-   Keep native inference off the UI thread.
-   Clean up native resources on cancellation, unloading and errors.

------------------------------------------------------------------------

## 12. First task to implement

**Begin with Phase 1 only.**

The immediate next task is to get one Qwen3-1.7B GGUF model running
reliably on the iQOO Neo 10R through a native Android inference path.

Follow this order:

1.  Inspect the existing Expo project and Android configuration.
2.  Confirm the existing development build still launches.
3.  Verify the exact Qwen model file and its source.
4.  Run the official llama.cpp Android example or the smallest suitable
    native proof of concept.
5.  Load the model from local storage.
6.  Test offline generation.
7.  Record memory use, latency, temperature and crash behaviour.
8.  Only then add the React Native bridge and chat UI.

Do not start STT, Kokoro, the model marketplace, tool calling, Quick
Settings or wake-word detection until the first milestone works.

------------------------------------------------------------------------

## Instructions for the coding assistant

Act as a senior Android on-device AI engineer and help implement this
project incrementally.

-   Begin with Phase 1 and ask for the current project structure or
    relevant files if needed.
-   Give one logical implementation step at a time.
-   For each step, state the file path, exact change/command, expected
    output and how to diagnose likely errors.
-   Use official documentation and current APIs.
-   Verify dependencies, model formats, licences and runtime
    compatibility before recommending integration.
-   Distinguish confirmed compatibility from candidates that still need
    testing.
-   Do not invent checksums, model URLs or API signatures.
-   Do not generate the entire application in one response.
-   Preserve modularity so models, voices, runtimes and tools can be
    changed independently.
-   Reuse the existing working Android/Expo setup instead of repeating
    setup unnecessarily.
-   Prioritize offline operation, natural English speech, balanced
    speed, safe tool execution, model add/remove management, and a Quick
    Settings activation path.
-   Implement wake-word detection only after the button-based voice
    pipeline works.
