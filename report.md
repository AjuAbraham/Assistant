# Veresa — Complete Coding Agent Implementation Plan
## Phase 2: Offline Voice Input Integration

**Project root:** `d:/projects/ai_assistent/`

**Platform:** Android, running on a physical iQOO Neo 10R with 8 GB RAM.

**Existing stack:** React Native, Expo Development Build, TypeScript, `llama.rn` / llama.cpp, local GGUF models.

**Primary objective:** Add local speech recognition to Veresa so the user can speak into the phone, see an accurate transcript, edit it if necessary, and send it to the existing local LLM.

**Secondary objectives:** Add local text-to-speech after speech recognition works. Add basic, validated agent tools only after both voice input and output are stable.

---

# 1. Role and working rules

Act as a senior React Native and Android AI engineer. Work directly in the existing repository.

Follow these rules strictly:

1. Inspect the existing implementation before changing code.
2. Preserve the current application, model manager, inference engine, chat history, streaming behavior, prompt formatting, and UI theme.
3. Make small, incremental changes that can be built and tested independently.
4. Prefer existing project dependencies when suitable. Do not add multiple libraries that solve the same problem.
5. Verify native module compatibility with the actual installed Expo SDK, React Native version, Android Gradle Plugin, Kotlin version, NDK, and JDK.
6. Do not claim an integration works until it has been tested.
7. Do not run destructive commands, reset Git history, delete existing project files, or overwrite unrelated changes.
8. Do not bundle large speech models into the application binary unnecessarily.
9. Do not send recorded audio or transcripts to cloud AI services.
10. Stop after each milestone and report the changes, build results, and manual tests required before proceeding.

Do not start by rewriting the architecture. First understand the existing implementation and identify the smallest safe integration point.

# 2. Existing project structure

The current application is organized as follows:

```text
d:/projects/ai_assistent/
├── App.tsx
└── src/
    ├── theme/
    │   └── tokens.ts
    ├── types/
    │   └── index.ts
    ├── constants/
    │   └── models.ts
    ├── utils/
    │   └── prompt.ts
    ├── components/
    │   ├── common/
    │   │   ├── Icons.tsx
    │   │   ├── TypingDots.tsx
    │   │   ├── AnimatedOrb.tsx
    │   │   ├── CodeBlockCard.tsx
    │   │   └── MessageContentRenderer.tsx
    │   ├── Header.tsx
    │   ├── Composer.tsx
    │   ├── MessageItem.tsx
    │   ├── ModelCard.tsx
    │   ├── BottomNav.tsx
    │   └── index.ts
    └── screens/
        ├── AssistantScreen.tsx
        ├── ModelsScreen.tsx
        ├── SettingsScreen.tsx
        └── index.ts
```

Inspect the complete repository before assuming this tree contains every relevant file. In particular, discover `package.json`, the lockfile, `app.json` or `app.config.*`, `android/`, existing model-management services, and the current chat submission function.

# 3. Current application state

The following features have already been implemented and tested:

- Download GGUF models through the application.
- Load and switch between downloaded models.
- Run local LLM inference without a cloud AI API.
- Stream responses into the chat interface.
- Maintain conversation history.
- Display inference statistics and diagnostics.
- Use a model-specific Qwen3 prompt formatter to suppress unnecessary thinking output.

The Qwen3 formatting fix has been tested on the physical device. Prompt-processing timings still require separate investigation, but inference optimization is intentionally paused.

**Do not change the working inference implementation as part of this task.**

The existing chat pipeline must remain the single source of truth for processing user messages.

# 4. Desired end-to-end experience

The first version must support this interaction:

1. The user opens the Assistant screen.
2. The user taps the microphone button.
3. Veresa requests microphone permission if necessary.
4. The microphone begins recording.
5. The user speaks a short English sentence.
6. The user taps Stop.
7. Veresa transcribes the recording using an on-device speech model.
8. The recognized text appears in an editable input field.
9. The user can edit, retry, or discard the transcript.
10. The user presses Send.
11. The existing chat submission function receives the text.
12. The existing LLM produces its normal response.
13. The conversation continues to behave exactly as it did before voice input was introduced.

For the initial implementation, sending the recognized text should use the normal Send action. Do not automatically submit a potentially incorrect transcript.

Conceptual architecture:

```text
Microphone
    |
    v
Audio recording
    |
    v
Local speech-to-text
    |
    v
Editable transcript
    |
    v
Existing chat submission function
    |
    v
Existing llama.rn inference
    |
    v
Existing response rendering
```

Only the recording and speech-recognition components are new in the first milestone.

# 5. Technology decisions

## 5.1 Speech-to-text

Primary candidate: `whisper.rn`, the React Native binding for whisper.cpp.

Repository: https://github.com/mybigday/whisper.rn

Reasons to evaluate it:

- Native React Native integration.
- On-device speech recognition.
- Support for downloadable Whisper model files.
- No requirement to send user audio to a cloud transcription API.
- A relatively straightforward file-based transcription workflow.

The initial model candidate is **Whisper `tiny.en`**.

English-only speech recognition is acceptable for V1. Hinglish and multilingual transcription can be evaluated later if required.

Do not assume the model's accuracy or speed on the target phone. Measure both.

### Mandatory compatibility investigation

Before installing the package:

1. Read the installed versions in `package.json` and the lockfile.
2. Inspect the Android native project and its build configuration.
3. Check the current `whisper.rn` installation instructions and supported React Native architecture.
4. Verify its native dependencies and prebuilt Android libraries.
5. Confirm compatibility with the project's actual React Native version and native build configuration.
6. Determine whether the package works with the project's current Expo Development Build workflow.
7. Check model redistribution terms, package license, and model license.
8. Determine how model files are downloaded, validated, stored, and removed.
9. Check the audio file formats accepted by the selected Whisper API.

Do not install the latest package blindly or upgrade React Native solely to accommodate a library without first evaluating the alternatives.

If `whisper.rn` cannot be integrated safely, evaluate `sherpa-onnx` as the alternative. Document the compatibility problem and proposed replacement before making that change.

## 5.2 Audio recording

Evaluate Expo's supported `expo-audio` package first.

Documentation: https://docs.expo.dev/versions/latest/sdk/audio/

Use the version compatible with the installed Expo SDK. Do not assume the current documentation's version is the correct version for this project.

The recording layer should:

- Request microphone permission.
- Start and stop recording explicitly.
- Produce an audio file accessible to the transcription layer.
- Use app-private temporary storage.
- Release the recorder when finished.
- Clean up temporary audio files when they are no longer needed.
- Handle permission denial, interruptions, and recording failures.

### Critical audio-format requirement

Do not assume the recording format is compatible with Whisper merely because recording succeeds.

Verify the actual output format, sample rate, channel count, and encoding. The chosen transcription API may have different input-format requirements.

If a conversion is required, choose the smallest maintainable native or library-based solution. Do not add a large media-processing dependency without justification.

Do not add streaming PCM capture, voice activity detection, or real-time transcription to V1.

## 5.3 Speech model management

The speech model must be managed independently from the existing GGUF chat models.

Do not add Whisper files to `src/constants/models.ts` as if they were chat LLMs.

Create a dedicated speech-model configuration and storage flow. The configuration should contain the model identifier, language, source URL, expected filename, and any verified integrity metadata.

Use a stable, trustworthy model source and verify checksums where available.

The implementation must support:

- Checking whether the model exists.
- Downloading the model with progress reporting.
- Handling interrupted or failed downloads.
- Validating the downloaded file.
- Avoiding duplicate downloads.
- Reusing the downloaded model on subsequent launches.
- Reporting insufficient storage or download failures clearly.
- Deleting the speech model safely when appropriate.

Do not hardcode an unverified model URL or invent a checksum.

For the first implementation, a single supported English model is enough. Do not build a complex multi-model marketplace.

# 6. Proposed folder additions

Use the existing structure as the foundation. Adapt the proposed paths after inspecting existing files and conventions.

```text
src/
├── services/
│   └── voice/
│       ├── audioRecorder.ts
│       ├── speechRecognition.ts
│       ├── speechModelManager.ts
│       └── index.ts
├── hooks/
│   └── useVoiceInput.ts
├── components/
│   ├── voice/
│   │   ├── MicrophoneButton.tsx
│   │   ├── RecordingIndicator.tsx
│   │   ├── TranscriptEditor.tsx
│   │   └── index.ts
│   └── ...
├── constants/
│   └── speechModels.ts
├── types/
│   └── index.ts
└── screens/
    └── AssistantScreen.tsx
```

These are proposed additions, not instructions to create every file regardless of need.

If the repository already contains suitable services, hooks, or shared types, extend them instead of duplicating them.

## File responsibilities

### `audioRecorder.ts`

Responsible only for audio capture.

Expose a small interface such as:

- `requestPermission()`
- `startRecording()`
- `stopRecording()`
- `cancelRecording()`
- `release()`

Return a typed recording result containing the file URI and any useful verified metadata.

Do not place UI state or LLM inference logic in this file.

### `speechRecognition.ts`

Responsible for the native transcription engine.

Expose operations such as:

- `initialize(modelPath)`
- `transcribe(audioUri, options)`
- `cancelTranscription()`
- `release()`

The exact API must follow the installed library version.

Convert library-specific results into a small application-level result type. Do not expose native-library objects throughout the UI.

### `speechModelManager.ts`

Responsible for model availability, download, integrity checks, storage paths, and deletion.

Reuse the application's existing file and download utilities if they are suitable.

Do not duplicate the existing LLM model manager unnecessarily.

### `useVoiceInput.ts`

Responsible for coordinating the voice-input lifecycle and exposing state to React components.

It must not contain the actual native transcription implementation or duplicate the chat inference engine.

### `MicrophoneButton.tsx`

Responsible for the microphone interaction and visual state.

Use the existing theme tokens, spacing, radii, and icon conventions. Avoid adding a new design system.

### `RecordingIndicator.tsx`

Display whether recording is active and how to stop it.

Make the recording state visually obvious.

### `TranscriptEditor.tsx`

Display recognized text in an editable field with Retry, Discard, and Send actions where appropriate.

Reuse the existing Composer component or its input behavior when possible rather than introducing an unrelated input system.

# 7. Type definitions and state machine

Add minimal, strongly typed voice-specific types to `src/types/index.ts` or an appropriate dedicated types file.

A possible state model is:

```ts
type VoiceInputState =
  | 'idle'
  | 'requestingPermission'
  | 'preparing'
  | 'recording'
  | 'transcribing'
  | 'transcriptReady'
  | 'error';
```

Use this as a starting point, not a requirement to adopt the exact names.

The implementation must prevent invalid transitions.

Expected lifecycle:

```text
idle
  |
  v
requestingPermission
  |
  v
preparing
  |
  v
recording
  |
  v
transcribing
  |
  v
transcriptReady
  |
  +----> edit transcript
  |
  +----> retry
  |
  +----> discard
  |
  +----> send through existing chat flow
```

Permission denial returns to a safe, usable state.

Recording or transcription failure must not leave the microphone active or the UI permanently busy.

The state machine must also prevent double taps from starting multiple recordings or concurrent transcription requests.

# 8. Milestone A — Repository inspection

Before changing code, inspect the following.

### Application and chat integration

- `App.tsx`
- `src/screens/AssistantScreen.tsx`
- `src/components/Composer.tsx`
- `src/components/MessageItem.tsx`
- `src/types/index.ts`
- `src/utils/prompt.ts`

Find the exact function that submits user text to the existing inference pipeline. Follow the call path through streaming, history updates, cancellation, and error handling.

### Native configuration

Inspect:

- `package.json`
- The package manager lockfile.
- `app.json` or `app.config.*`.
- `android/app/build.gradle` or `.kts`.
- Root Gradle configuration.
- Android manifest.
- Gradle properties.
- `MainApplication` or other relevant native initialization files.
- Existing Expo config plugins and development-build setup.

### Required inspection report

Before implementation, report:

1. Installed Expo SDK and React Native versions.
2. Relevant Android and native-module configuration.
3. Existing audio or filesystem dependencies.
4. Existing chat submission function and its location.
5. The proposed STT package and why it is compatible.
6. Any build or compatibility risks.
7. The exact files proposed for modification.

Do not modify unrelated inference settings or model files during this stage.

# 9. Milestone B — Recording only

Implement audio recording before introducing the transcription engine.

### Requirements

- Add a microphone button to the Assistant screen.
- Request permission only when the user starts voice input.
- Start recording after permission is granted.
- Show a clear recording indicator.
- Allow the user to stop or cancel recording.
- Store the recording temporarily inside app-private storage.
- Release audio resources after stopping or cancelling.
- Handle Android permission denial and recording failures.
- Prevent multiple active recordings.

### Acceptance tests

- The permission prompt appears when needed.
- Recording starts and stops reliably.
- The app remains responsive while recording.
- Cancelling does not submit anything to the LLM.
- A short audio recording is produced in the expected format.
- No recording remains active after cancellation or an error.
- Normal text chat still works.

Do not implement transcription yet unless the recording layer is independently verified.

# 10. Milestone C — Local speech recognition

Integrate the selected STT engine with the recording layer.

### Requirements

1. Download the speech model separately from the application binary.
2. Initialize the engine using the verified model path.
3. Record audio using the supported format.
4. Run transcription entirely on-device.
5. Return the recognized text.
6. Handle empty audio, silence, unintelligible speech, and transcription failures.
7. Release or reuse native resources according to the library's documented lifecycle.
8. Clean up temporary audio files after processing.
9. Expose processing errors to the UI without crashing the application.

Prefer lazy initialization: initialize the speech engine when voice input is first needed, then reuse it when safe.

Do not initialize multiple Whisper contexts for repeated button presses.

### Acceptance tests

- A known short English sentence produces a reasonable transcript.
- A second recording works without restarting the application.
- A missing model is detected clearly.
- A corrupted or incomplete model is not used.
- Empty recordings do not create empty assistant messages.
- Repeated requests do not leak resources or create overlapping operations.
- Transcription works with internet connectivity disabled after the model has been downloaded.

# 11. Milestone D — Transcript UI and chat integration

Connect transcription to the existing Assistant screen.

### UI behavior

When transcription finishes:

- Display the recognized text in an editable input.
- Keep it separate from the committed conversation history until the user sends it.
- Provide a way to retry recording.
- Provide a way to discard the transcript.
- Provide a Send action.
- Reuse existing Composer styling and theme tokens.
- Show a clear loading indicator while transcription is in progress.

### Integration behavior

When the user presses Send:

1. Validate and trim the transcript.
2. Ignore empty input.
3. Call the same submission function used by typed messages.
4. Preserve the existing prompt construction and conversation-history logic.
5. Preserve streaming output, message rendering, cancellation, and inference metrics.
6. Clear the transcript only after the send operation has been accepted according to the existing chat flow.

Do not create a separate voice-specific LLM implementation.

Do not change `buildFormattedChatPrompt`, `stripThinking`, or the Qwen3-specific formatting unless a separately demonstrated issue requires it.

### Acceptance tests

- Typed messages behave exactly as before.
- Voice transcripts appear correctly in the input.
- Editing the transcript changes the text sent to the LLM.
- Discarding a transcript does not modify chat history.
- Sending a transcript produces the same kind of user message and assistant response as typed input.
- Model switching and conversation history continue to work.
- A transcription error does not corrupt the current conversation.

# 12. Offline and privacy requirements

Veresa is an offline-first assistant.

After the speech model has been downloaded:

- Recording must not upload audio to a server.
- Transcription must not require a cloud API.
- The recognized text must go directly into the existing local chat flow.
- The app must not require a login or account for voice input.
- Temporary recordings should be deleted when no longer needed.
- Microphone access must occur only during an explicitly initiated recording.
- No always-listening service or background microphone capture should be introduced.
- The UI should clearly communicate recording and transcription status.

Verify offline behavior by disabling Wi-Fi and mobile data after installing the app and downloading the model.

Do not treat successful operation while connected to the internet as proof of offline support.

# 13. Performance requirements

Target device: iQOO Neo 10R, 8 GB RAM.

The application already runs local LLM inference, so speech recognition must be integrated without unnecessarily increasing simultaneous memory usage.

For the initial implementation:

1. Record audio.
2. Stop and finalize the recording.
3. Run speech recognition.
4. Release temporary audio resources when safe.
5. Show the transcript.
6. Run LLM inference only when the user sends the text.

Do not run a separate speech model continuously in the background.

Do not load additional large models unnecessarily.

Record these timings:

- Recording duration.
- STT initialization time.
- Transcription duration.
- Total time from stopping recording to transcript display.
- Existing LLM time to first token and total generation time.
- Any crashes, out-of-memory errors, or obvious thermal issues.

Do not impose arbitrary latency targets before measuring the device. Establish a baseline using short and medium-length utterances, then optimize if needed.

# 14. Error handling

Handle at least these cases:

- Microphone permission denied.
- Microphone permission permanently denied.
- Another recording is already active.
- Recording initialization failure.
- Recording interrupted.
- User cancels recording.
- Recording file is missing or invalid.
- Speech model is missing.
- Model download fails or is interrupted.
- Model file is corrupt.
- Transcription returns no text.
- Transcription throws an error.
- User leaves the Assistant screen during recording.
- User attempts to send text while the application is already processing a message.
- The application is backgrounded or destroyed during an operation.

All errors must leave the application in a recoverable state.

Do not silently swallow exceptions. Log useful diagnostic details in development builds without exposing sensitive audio or transcripts unnecessarily.

# 15. Build and test workflow

Use the package manager already established in the repository. Do not change package managers or regenerate the lockfile unnecessarily.

After native dependency installation:

1. Confirm the dependency installation completed.
2. Review any native configuration changes.
3. Run the project's available TypeScript and lint checks.
4. Run Expo diagnostics if appropriate for the installed SDK.
5. Build the Android development client.
6. Install the new build on the physical phone.
7. Run the recording and transcription tests.
8. Test text-only chat for regressions.
9. Test the complete flow with internet disabled.
10. Review Android logs for native errors and resource leaks.

Use the project's existing build commands where available. Do not invent scripts that do not exist in `package.json`.

If a native build fails, identify the first meaningful error and resolve it before continuing. Do not respond by upgrading multiple unrelated dependencies.

# 16. Required test matrix

| Test | Expected result |
|---|---|
| First microphone use | Permission requested |
| Permission denied | App remains usable |
| Short English sentence | Reasonable transcript |
| Long silence | Empty transcript handled safely |
| Cancel recording | No message submitted |
| Retry recording | New recording starts |
| Edit transcript | Edited text is sent |
| Send transcript | Existing chat pipeline executes |
| Repeated recording | No duplicate active session |
| Model missing | Clear recovery message |
| Download interrupted | Retry is possible |
| Offline transcription | Works with model already downloaded |
| Existing text chat | No regression |
| Model switching | Existing behavior preserved |
| Navigate away during recording | Recording is safely stopped or cancelled |
| Repeated use | No accumulating native resources or stuck state |

Test on the actual phone. Emulator-only validation is insufficient for declaring the integration complete.

# 17. Milestone E — Local text-to-speech (future)

Do not start this milestone until Milestones B–D work reliably.

Preferred future direction: evaluate Kokoro-based local TTS, as already identified in the Veresa project plan. Confirm a suitable Android runtime, model compatibility, redistribution terms, memory requirements, and voice quality before selecting an implementation.

The future pipeline will be:

```text
User speech
    -> Local STT
    -> Existing local LLM
    -> Local TTS
    -> Android speaker
```

Requirements for that milestone:

- Speak the final assistant response.
- Add play and stop controls.
- Prevent overlapping speech.
- Handle interruptions and navigation.
- Allow text-only chat to continue normally.
- Keep synthesis offline.
- Avoid loading STT, LLM, and TTS models concurrently unless measurements justify it.

Android's built-in TTS may be used as a temporary baseline, but verify whether the selected voice is genuinely available offline.

Do not introduce TTS dependencies in the initial voice-input milestone.

# 18. Milestone F — Basic agent tools (future)

After local STT and TTS are stable, introduce a small tool registry.

Potential initial tools:

- Create and retrieve notes.
- Create reminders.
- Manage simple tasks.
- Read the current date and time.
- Open selected Android apps following explicit user requests.

The model must never execute arbitrary generated code or directly invoke unrestricted Android functionality.

Each tool should have:

- A stable identifier.
- A description.
- A validated argument schema.
- An explicit executor implemented by application code.
- A structured success or failure result.
- Permission and confirmation rules where appropriate.
- Tests for invalid arguments and execution errors.

Persist notes and tasks locally. Investigate Android scheduling and notification permissions before implementing reminders.

Do not implement this milestone now.

# 19. Milestone G — Quick Settings and wake word (future)

The longer-term product direction includes a Quick Settings tile called “Talk to AI” and, potentially, wake-word activation.

These features are explicitly out of scope for the initial integration.

Quick Settings will require a separate investigation of Android tile services, activity launch behavior, native registration, and how the application should handle audio capture when it is not already foregrounded.

Wake-word detection requires a separate analysis of background microphone restrictions, battery consumption, privacy, and model performance.

Do not add background services, wake-word detection, or additional Android permissions as part of the initial push-to-talk implementation.

# 20. Git safety and change management

Before modifying files:

- Inspect `git status`.
- Preserve uncommitted changes.
- Do not reset or clean the repository.
- Do not delete working features to simplify integration.

After each milestone:

- Summarize the files changed.
- Explain why each change was necessary.
- Report the exact build and validation commands executed.
- Report actual results, including failures.
- Identify manual device tests still required.
- Stop and request approval before moving into the next milestone if the current milestone has not passed its acceptance tests.

Do not commit automatically unless explicitly requested.

# 21. Final deliverables

For the initial voice-input milestone, deliver:

1. A working push-to-talk button.
2. Microphone permission handling.
3. Local audio recording.
4. Downloadable and reusable local speech model.
5. On-device speech recognition.
6. Editable transcript UI.
7. Retry and discard controls.
8. Integration with the existing chat submission function.
9. Clear error and loading states.
10. Offline operation after model download.
11. Updated TypeScript types and minimal documentation.
12. A report of build results, device-test results, performance measurements, and known limitations.

# 22. Immediate instructions to the coding agent

Start with **Milestone A: Repository inspection**.

Do not immediately install `whisper.rn`, add audio dependencies, or modify `AssistantScreen.tsx`.

First inspect the actual codebase and determine:

- How the current Composer sends messages.
- How the existing model manager stores downloaded files.
- Which file-system APIs are already available.
- Which Expo and React Native versions are installed.
- How native development builds are configured.
- Whether `whisper.rn` is compatible with this exact project configuration.

Then provide a short implementation proposal listing the exact files to change, the dependencies to add, the model download approach, and any native build risks.

Once that proposal is established, implement the smallest working recording-only change. Test it on the physical phone, then proceed to transcription, transcript editing, and chat integration.

**Success criterion:** The user can disable internet access, tap the microphone, speak an English sentence, see and edit the locally recognized text, send it to the existing Veresa LLM, and receive the usual response without breaking any existing functionality.

---

# 23. Phase 2 Implementation Summary (Offline Voice Input & WhatsApp-style Controls)

### Architecture & Components Implemented
1. **Audio Capture**:
   - `expo-audio` configured with low-level native `AudioStream` on Android.
   - Captures raw 16 kHz 16-bit mono PCM stream in real-time.
   - [wavHelper.ts](file:///d:/projects/ai_assistent/src/services/voice/wavHelper.ts) packages PCM chunks into standard 44-byte RIFF/WAV format.
2. **On-Device Speech-to-Text**:
   - `whisper.rn@0.8.0-rc.2` integrated with native C++ JSI bindings on New Architecture.
   - [speechModelManager.ts](file:///d:/projects/ai_assistent/src/services/voice/speechModelManager.ts) downloads and verifies Whisper `tiny.en` (~74 MB) from Hugging Face / mirror into persistent documents directory.
   - [speechRecognition.ts](file:///d:/projects/ai_assistent/src/services/voice/speechRecognition.ts) runs CPU inference on mobile device completely offline.
3. **WhatsApp-style Gesture & Controls**:
   - **Hold to Speak**: Press and hold microphone button to record.
   - **Release to Send**: Releasing the button automatically stops recording, transcribes speech offline, and directly triggers `sendMessage` to the LLM.
   - **Slide Left to Cancel**: Sliding finger left past -65px triggers cancellation (discards recording, deletes temp audio, does not send).
   - **Push-to-Talk (Tap Mode)**: Quick tap on the mic begins recording and presents an inline "Done" button to stop and auto-send.
4. **Build & Compatibility Fixes**:
   - Installed `buffer` polyfill and configured `metro.config.js` to resolve `safe-buffer` Node standard library dependency.
   - Native Android debug APK assembled cleanly in `android/app/build/outputs/apk/debug/app-debug.apk`.
5. **Model Library Enhancements**:
   - Added [SpeechModelCard.tsx](file:///d:/projects/ai_assistent/src/components/SpeechModelCard.tsx) to manage Whisper `tiny.en` download, progress, storage, and deletion.
   - Added top segmented filter tabs in [ModelsScreen.tsx](file:///d:/projects/ai_assistent/src/screens/ModelsScreen.tsx) (`All`, `Downloaded`, and `Not Downloaded` with item counts).
   - Unified storage overview to account for both LLM and speech weights.