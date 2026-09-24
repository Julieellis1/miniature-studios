// src/lib/scriptSchema.ts
import { z } from "zod";
export const SceneSchema = z.object({
  slug: z.string(), durationSec: z.number(),
  setting: z.string(), backgroundTheme: z.string(), lighting: z.string(),
  beats: z.array(z.string()).min(1),
  camera: z.object({ shotSize: z.string(), angle: z.string(), movement: z.string(), lens: z.string() }),
  dialogue: z.array(z.string()),
  sound: z.object({ sfx: z.array(z.string()), music: z.string() }),
  transition: z.string(), aiPrompt: z.string(), negativePrompt: z.string(),
});
export const ScriptSchema = z.object({ consistencyBlock: z.string(), scenes: z.array(SceneSchema).min(1) });
export type Scene = z.infer<typeof SceneSchema>;
export type ProScript = z.infer<typeof ScriptSchema>;
export function toMarkdown(s: z.infer<typeof ScriptSchema>) {
  return `# Shoot Script\n\n## Consistency\n${s.consistencyBlock}\n\n` + s.scenes.map((sc, i) => `## Scene ${i + 1} — ${sc.slug} (${sc.durationSec}s)\nSetting: ${sc.setting}\nBackground: ${sc.backgroundTheme}\nLighting: ${sc.lighting}\nBeats:\n- ${sc.beats.join("\n- ")}\nDialogue:\n- ${sc.dialogue.length ? sc.dialogue.join("\n- ") : "(none)"}\nCamera: ${sc.camera.shotSize}, ${sc.camera.angle}, ${sc.camera.movement}, ${sc.camera.lens}\nSound: ${sc.sound.sfx.join("; ")} | Music: ${sc.sound.music}\nTransition: ${sc.transition}\n\nAI PROMPT:\n${sc.aiPrompt}\n\nNEGATIVE:\n${sc.negativePrompt}\n`).join("\n---\n");
}
