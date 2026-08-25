import { describe, it } from "node:test";
import assert from "node:assert/strict";

export type SoundEffect = "check" | "uncheck" | "finish" | "delete" | "reset";

export interface SoundProfile {
  type: OscillatorType;
  startFreq: number;
  endFreq?: number;
  duration: number;
  notes?: number[];
}

export const SOUND_PROFILES: Record<SoundEffect, SoundProfile> = {
  check: {
    type: "sine",
    startFreq: 523.25, // C5
    endFreq: 659.25,   // E5 (rising)
    duration: 0.15,
  },
  uncheck: {
    type: "sine",
    startFreq: 440,    // A4
    endFreq: 330,      // E4 (falling)
    duration: 0.12,
  },
  finish: {
    type: "triangle",
    startFreq: 523.25,
    notes: [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6 arpeggio
    duration: 0.5,
  },
  delete: {
    type: "square",
    startFreq: 130,    // Damped low frequency thud
    endFreq: 60,
    duration: 0.18,
  },
  reset: {
    type: "sine",
    startFreq: 300,    // Swoosh sweep
    endFreq: 800,
    duration: 0.25,
  },
};

export class AudioSynthesizerEngine {
  public isMuted = false;
  public contextState: "suspended" | "running" = "suspended";
  public playedEvents: Array<{ sound: SoundEffect; profile: SoundProfile; timestamp: number }> = [];

  resumeContext(): void {
    this.contextState = "running";
  }

  playSound(sound: SoundEffect): boolean {
    if (this.isMuted) return false;
    
    // Auto-resume suspended context on user interaction
    if (this.contextState === "suspended") {
      this.resumeContext();
    }

    const profile = SOUND_PROFILES[sound];
    if (!profile) return false;

    this.playedEvents.push({
      sound,
      profile,
      timestamp: Date.now(),
    });
    return true;
  }
}

describe("Feature 5: Audio Feedback Synthesizer Sound Envelope Triggers", () => {
  it("T1.5.1: 'check' sound triggers rising pitch sine wave envelope", () => {
    const synth = new AudioSynthesizerEngine();
    const played = synth.playSound("check");
    assert.equal(played, true);
    assert.equal(synth.playedEvents.length, 1);
    
    const evt = synth.playedEvents[0];
    assert.equal(evt.sound, "check");
    assert.equal(evt.profile.type, "sine");
    assert.equal(evt.profile.startFreq, 523.25);
    assert.equal(evt.profile.endFreq, 659.25);
    assert.equal(evt.profile.duration, 0.15);
  });

  it("T1.5.2: 'uncheck' sound triggers falling pitch sine wave envelope", () => {
    const synth = new AudioSynthesizerEngine();
    synth.playSound("uncheck");
    const evt = synth.playedEvents[0];
    assert.equal(evt.sound, "uncheck");
    assert.equal(evt.profile.type, "sine");
    assert.equal(evt.profile.startFreq, 440);
    assert.equal(evt.profile.endFreq, 330);
  });

  it("T1.5.3: 'finish' sound triggers 4-note celebratory arpeggio (C5-E5-G5-C6)", () => {
    const synth = new AudioSynthesizerEngine();
    synth.playSound("finish");
    const evt = synth.playedEvents[0];
    assert.equal(evt.sound, "finish");
    assert.deepEqual(evt.profile.notes, [523.25, 659.25, 783.99, 1046.5]);
  });

  it("T1.5.4: 'delete' thud and 'reset' swoosh sound envelopes", () => {
    const synth = new AudioSynthesizerEngine();
    synth.playSound("delete");
    synth.playSound("reset");
    assert.equal(synth.playedEvents[0].sound, "delete");
    assert.equal(synth.playedEvents[0].profile.type, "square");
    assert.equal(synth.playedEvents[1].sound, "reset");
    assert.equal(synth.playedEvents[1].profile.startFreq, 300);
    assert.equal(synth.playedEvents[1].profile.endFreq, 800);
  });

  it("T1.5.5 & T5.10: Auto-unlock suspended context and mute toggle suppression", () => {
    const synth = new AudioSynthesizerEngine();
    assert.equal(synth.contextState, "suspended");
    synth.playSound("check");
    assert.equal(synth.contextState, "running");

    synth.isMuted = true;
    const mutedPlay = synth.playSound("check");
    assert.equal(mutedPlay, false);
  });
});
