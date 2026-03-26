class LibImageQuant {
  constructor(options = {}) {
    this.wasmModule = null;
    this.isInitialized = false;
    this.wasmUrl = options.wasmUrl;
    this.preloadedWasmModule = options.wasmModule;
    this.initPromise = this.initializeWasm();
  }
  /**
   * Initialize the WASM module
   */
  async initializeWasm() {
    if (this.isInitialized) return;
    if (this.preloadedWasmModule) {
      this.wasmModule = this.preloadedWasmModule;
      await this.wasmModule.default(this.wasmUrl);
      this.isInitialized = true;
      return;
    }
    try {
      const wasmLoaderPath = this.wasmUrl || new URL("./libimagequant_wasm.js", import.meta.url).href;
      this.wasmModule = await import(wasmLoaderPath);
      await this.wasmModule.default(this.wasmUrl);
      this.isInitialized = true;
    } catch (error) {
      throw new Error(
        `Failed to load WASM module. For Next.js applications, please provide the WASM module directly: 
import wasmModule from '@fe-daily/libimagequant-wasm/wasm/libimagequant_wasm.js';
const quantizer = new LibImageQuant({ wasmModule });
Original error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  /**
   * Quantize a PNG from bytes or Blob
   */
  async quantizePng(pngData, options = {}) {
    await this.initPromise;
    let pngBytes;
    if (pngData instanceof Blob) {
      const arrayBuffer = await pngData.arrayBuffer();
      pngBytes = new Uint8Array(arrayBuffer);
    } else if (pngData instanceof ArrayBuffer) {
      pngBytes = new Uint8Array(pngData);
    } else {
      pngBytes = pngData;
    }
    const decodedResult = this.wasmModule.decode_png_to_rgba(pngBytes);
    const rgbaData = decodedResult[0];
    const width = decodedResult[1];
    const height = decodedResult[2];
    return await this.quantizeRgbaData(rgbaData, width, height, options);
  }
  /**
   * Quantize from ImageData and return as PNG bytes or ImageData
   */
  async quantizeImageData(imageData, options = {}) {
    await this.initPromise;
    const rgbaData = new Uint8ClampedArray(imageData.data);
    return await this.quantizeRgbaData(rgbaData, imageData.width, imageData.height, options);
  }
  /**
   * Internal method to quantize RGBA data
   */
  async quantizeRgbaData(rgbaData, width, height, options) {
    const quantizer = new this.wasmModule.ImageQuantizer();
    if (options.speed !== void 0) {
      quantizer.setSpeed(options.speed);
    }
    if (options.quality !== void 0) {
      const { min = 0, target = 100 } = options.quality;
      quantizer.setQuality(min, target);
    }
    if (options.maxColors !== void 0) {
      quantizer.setMaxColors(options.maxColors);
    }
    if (options.posterization !== void 0) {
      quantizer.setPosterization(options.posterization);
    }
    const quantResult = quantizer.quantizeImage(rgbaData, width, height);
    const palette = quantResult.getPalette();
    const quality = quantResult.getQuantizationQuality();
    const paletteLength = quantResult.getPaletteLength();
    if (options.dithering !== void 0) {
      quantResult.setDithering(options.dithering);
    }
    const remappedRgbaData = quantResult.remapImage(rgbaData, width, height);
    const paletteIndices = quantResult.getPaletteIndices(rgbaData, width, height);
    const pngBytes = this.wasmModule.encode_palette_to_png(
      paletteIndices,
      palette,
      width,
      height
    );
    let outputImageData;
    try {
      outputImageData = new ImageData(remappedRgbaData, width, height);
    } catch (error) {
      outputImageData = {
        data: remappedRgbaData,
        width,
        height,
        colorSpace: "srgb"
      };
    }
    return {
      palette,
      pngBytes,
      imageData: outputImageData,
      quality,
      paletteLength,
      width,
      height
    };
  }
  /**
   * Clean up resources (no longer needed since we're not using workers)
   */
  dispose() {
  }
}
export {
  LibImageQuant as default
};
//# sourceMappingURL=index.mjs.map
