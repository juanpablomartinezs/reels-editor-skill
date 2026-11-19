// Every reel is one composition: its id, its reel and its duration (base.mp4's frame count, printed by cut.py).
import { Composition } from "remotion";
import { DURATION_EXAMPLE, ExampleReel } from "./ExampleReel";
import { FPS, H, W } from "./ui";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Example" component={ExampleReel} durationInFrames={DURATION_EXAMPLE} fps={FPS} width={W} height={H} />
    {/* <Composition id="Reel<name>" component={Reel<name>} durationInFrames={DURATION_<name>} fps={FPS} width={W} height={H} /> */}
  </>
);
