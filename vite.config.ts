import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// JS/CSS を単一の dist/index.html にインライン化し、
// ビルド成果物1つをコピーするだけでオフライン利用できるようにする。
export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    target: 'es2020',
  },
});
