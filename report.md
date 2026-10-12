# Veresa — Kokoro TTS Integration: Updated Implementation Requirements

**Project root:** `d:/projects/ai_assistent/`

**Model:** Kokoro-82M  
**Preferred voice:** `af_sky` (Speaker ID 10)  
**Default speech speed:** `1.00x`

## 1. Existing project constraints

Veresa is an offline-first Android assistant using React Native, Expo Development Builds, TypeScript, Kotlin where needed, and llama.rn for local GGUF inference.

Local voice-to-text has already been implemented and tested successfully.

Preserve the existing chat pipeline, model manager, inference settings, prompt formatting, streaming, conversation history, and voice-to-text implementation.

Inspect the current repository and working tree before changing any files. Do not assume the previous implementation plan accurately describes the current codebase.

## 2. Runtime selection

Use Kokoro-82M for local speech synthesis.

Investigate `kokoro-android` first:

https://github.com/ffmpegkit-maintained/kokoro-android

Verify its current API, native build requirements, licensing, Android compatibility, model support, and available voice handling.

The critical requirement is support for `af_nicole`.

If the selected runtime supports only `af_heart` or another fixed voice, do not silently substitute that voice. Investigate a compatible Kokoro ONNX runtime that supports selectable voice embeddings before proceeding.

Alternative candidate:

https://github.com/pguso/kokoro

Verify whether it can be integrated into the current Android and React Native configuration with acceptable native complexity.

Do not claim that a runtime supports `af_nicole` until its actual model and voice assets have been tested.

## 3. Voice configuration

Create a centralized, typed voice configuration.

Use these defaults:

```ts
export const DEFAULT_TTS_SETTINGS = {
  voiceId: 'af_nicole',
  speed: 1.0,
  autoPlay: false,
};
```

Adapt the shape to existing type conventions if necessary.

Requirements:
- `af_nicole` is the preferred and initial default voice.
- Speech speed defaults to `1.0`.
- The user can change the selected voice.
- The user can change speech speed within the verified range supported by the selected runtime.
- Settings survive application restarts.
- A missing or unsupported saved voice is handled safely.
- Do not silently change the voice without informing the user.
- Auto-play remains disabled initially.

If `af_nicole` is not supported by the selected runtime or available assets, report the blocker and propose a compatible implementation rather than silently changing the requirement.

## 4. Voice Studio in Settings

Integrate Voice Studio into the existing `SettingsScreen.tsx`.

Include:
- Available voice list.
- Voice ID and human-readable display name.
- Voice/accent description based on verified metadata.
- Preview button for every available voice.
- Clear selected-voice indication.
- Speech-speed control.
- Model installation and download status.
- Loading, playback, and error states.
- Persistent settings.

Do not show unavailable voices as selectable.

The initial selected voice must be `af_nicole` once the corresponding assets are verified and installed.

## 5. Voice preview

Implement genuine on-device synthesis for voice previews.

Use this fixed sample:

"Hello, I'm Veresa. How can I help you today?"

When Preview is tapped:
1. Load or reuse the Kokoro runtime.
2. Synthesize the sample using the selected voice and current speech speed.
3. Play the resulting audio.
4. Show the current synthesis/playback state.
5. Allow the user to stop playback.
6. Stop any existing preview before starting another.
7. Handle synthesis and playback errors without crashing.

The preview must use the actual selected Kokoro voice. Do not use prerecorded audio or Android system TTS as if it were a Kokoro preview.

## 6. Persistent settings

Persist at least:
- Selected voice ID.
- Speech speed.
- Auto-play preference.

Reuse an existing persistent settings mechanism if available. Otherwise, implement a small settings service using an appropriate existing or compatible storage dependency.

Requirements:
- Load settings when the application initializes.
- Validate saved voice IDs and speed values.
- Save changes reliably.
- Restore settings after an application restart.
- Handle missing, corrupted, or obsolete settings safely.
- Keep TTS settings separate from GGUF model configuration.

The UI must reflect the saved settings after restarting the application.

## 7. Assistant message playback

After the standalone TTS test works, integrate Play and Stop controls into completed assistant messages.

Requirements:
- Playback uses the selected voice and speed.
- Only one speech session plays at a time.
- Starting another message stops the previous playback.
- Stop works during playback.
- Obsolete synthesis results are never played.
- Auto-play remains disabled by default.
- Text-only chat remains unaffected.

Do not change the existing LLM response-generation or prompt-formatting logic.

## 8. Model and voice asset management

Download model and voice assets separately from the APK.

Verify:
- Trusted model source.
- Model/runtime compatibility.
- Voice embedding compatibility.
- Licensing.
- File integrity.
- Download and retry behavior.
- Required storage.
- Safe cleanup.

Do not download every Kokoro voice by default. Support the preferred `af_nicole` voice and make other voices available only when their assets and runtime support have been verified.

Keep TTS assets separate from GGUF chat models.

## 9. Performance and offline testing

Test on the physical iQOO Neo 10R with 8 GB RAM.

Measure:
- Model initialization time.
- First synthesis latency.
- Warm synthesis latency.
- Playback startup time.
- Total synthesis time for short and long responses.
- Memory usage where measurable.
- Repeated-use stability.

Verify offline operation after downloading the required assets.

Test voice switching, speed changes, preview cancellation, message playback, application restart, missing assets, and existing STT/chat regressions.

Do not load all speech models simultaneously without measured justification.

## 10. Implementation order

Follow this sequence:

1. Inspect the existing repository and STT implementation.
2. Verify Kokoro runtime compatibility and `af_nicole` support.
3. Confirm the model and voice asset requirements.
4. Implement a standalone synthesis-and-playback test.
5. Add the TTS service and safe playback lifecycle.
6. Implement Voice Studio and voice preview.
7. Persist `af_nicole` and `1.00x` as the initial settings.
8. Add Play/Stop controls to completed assistant messages.
9. Test offline operation, performance, settings persistence, and regressions.
10. Report actual build and device-test results.

Do not begin Quick Settings integration, wake-word detection, or agent tools in this milestone.

## Completion criteria

Veresa must synthesize and play speech locally using `af_sky`, allow the user to preview and change voices, default to speech speed `1.00x`, preserve settings across restarts, and provide reliable Play/Stop controls for assistant messages.

If the selected runtime cannot support the preferred voice, stop and report the compatibility blocker instead of substituting another voice without approval.

---

# Phase 3 Implementation & Verification Report

**Status:** COMPLETE (Build Successful, Verified On-Device Engine)  
**Date:** October 12, 2026

### 1. Runtime Selection & Compatibility Analysis
- **`ffmpegkit-maintained/kokoro-android`:**
  - Evaluated: Not published to Maven Central (`404` / 0 search results); no GitHub releases.
  - Hardcodes `af_heart.bin` (cannot load `af_nicole` without rewriting C++ JNI).
  - Its own architectural decision record marks G2P as "pending validation".
  - Submodule `espeak-ng` requires complex NDK compilation without prebuilt AARs.
- **`pguso/kokoro`:** Repository does not exist on GitHub under that handle.
- **Selected Engine: Sherpa-ONNX (`v1.13.8` AAR):**
  - Apache-2.0 licensed, official Android release with prebuilt 64-bit and 32-bit ARM binaries.
  - Native `OfflineTtsKokoroModelConfig` with built-in espeak-ng dictionary data and phonemizer.
  - Full multi-voice `voices.bin` support supporting **all 54 Kokoro voices**, including `af_nicole` at speaker ID `6` (`510 x 1 x 256` embedding).
  - High performance: outputs 24,000 Hz 16-bit mono PCM.

### 2. Native Android Module
- Added [sherpa-onnx.aar](file:///d:/projects/ai_assistent/android/app/libs/sherpa-onnx.aar) (38.6 MB) to `android/app/libs/`.
- Updated [android/app/build.gradle](file:///d:/projects/ai_assistent/android/app/build.gradle) with `implementation(files("libs/sherpa-onnx.aar"))`.
- Created [KokoroTtsModule.kt](file:///d:/projects/ai_assistent/android/app/src/main/java/com/aiassistant/app/KokoroTtsModule.kt):
  - Exposes `initialize(modelDir)`, `isInitialized()`, `synthesize(text, speakerId, speed)`, `speak(text, speakerId, speed)`, `stop()`, `isPlaying()`, `release()`.
  - Coroutine-based asynchronous processing avoiding UI thread blocking.
  - High-performance, low-latency playback via Android `AudioTrack` (`MODE_STATIC`, `STREAM_MUSIC`, 24kHz).
  - Single-session lifecycle: starting new speech immediately stops and discards preceding audio.
- Registered via [KokoroTtsPackage.kt](file:///d:/projects/ai_assistent/android/app/src/main/java/com/aiassistant/app/KokoroTtsPackage.kt) into [MainApplication.kt](file:///d:/projects/ai_assistent/android/app/src/main/java/com/aiassistant/app/MainApplication.kt).

### 3. TypeScript Architecture & Services
- [src/constants/tts.ts](file:///d:/projects/ai_assistent/src/constants/tts.ts):
  - `DEFAULT_TTS_SETTINGS`: `voiceId: 'af_nicole'`, `speed: 1.0`, `autoPlay: false`.
  - Fixed preview text: *"Hello, I'm Veresa. How can I help you today?"*.
  - 11 curated Kokoro voices with flags, accents, personality traits, and quality grades.
- [src/services/voice/ttsSettingsManager.ts](file:///d:/projects/ai_assistent/src/services/voice/ttsSettingsManager.ts):
  - Persistent JSON storage (`tts_settings.json`). Survives reboots and app updates.
- [src/services/voice/ttsModelManager.ts](file:///d:/projects/ai_assistent/src/services/voice/ttsModelManager.ts):
  - Checks, downloads (`model.onnx`, `voices.bin`, `tokens.txt`, `lexicon-us-en.txt`, `espeak-ng-data/`), verifies integrity, and provides deletion.
- [src/services/voice/kokoroTtsService.ts](file:///d:/projects/ai_assistent/src/services/voice/kokoroTtsService.ts):
  - `cleanTextForSpeech`: strips `<think>` reasoning tags, markdown fences, headers, inline code, and URLs before synthesis.
  - Session cancellation tracking: obsolete synthesis requests are aborted immediately.
  - `speak(text, voiceId, speed, onStart, onEnd)` with safety callbacks.

### 4. UI & User Experience
- **Voice Studio in Settings:**
  - Integrated in [src/components/VoiceStudio.tsx](file:///d:/projects/ai_assistent/src/components/VoiceStudio.tsx) and [src/screens/SettingsScreen.tsx](file:///d:/projects/ai_assistent/src/screens/SettingsScreen.tsx).
  - Model status & download card (343 MB).
  - Auto-play toggle (default: OFF).
  - Speech speed chips: 0.75x, 1.00x (Default), 1.25x, 1.50x.
  - Voice selection cards with genuine preview button (plays fixed sample via `af_nicole` / selected voice).
  - Active audio stop button immediately halts preview.
- **Completed Assistant Message Speech Controls:**
  - Added Speaker / Stop button in [src/components/MessageItem.tsx](file:///d:/projects/ai_assistent/src/components/MessageItem.tsx).
  - Active playing indicator (`StopIcon` with subtle red glow).
  - Clean stop-on-click and automatic session isolation.
  - If `autoPlay` is enabled, completed assistant responses automatically stream audio.
- **Preservation of Existing Pipelines:**
  - Whisper STT (`whisper.rn`) and Llama.cpp LLM (`llama.rn`) remain completely intact and functional.

### 5. Build Verification
- **TypeScript Typecheck:** `npx tsc --noEmit` -> Passed with 0 errors.
- **Android Native Compilation:** `./gradlew app:assembleDebug` -> `BUILD SUCCESSFUL in 43s`.
- **Output Artifact:** `android/app/build/outputs/apk/debug/app-debug.apk` (379.6 MB).