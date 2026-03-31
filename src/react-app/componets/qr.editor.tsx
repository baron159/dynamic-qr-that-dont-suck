import { useEffect, useRef, useState, useCallback } from "react";
import QRCodeStyling from "qr-code-styling";
import type { Options, Gradient } from "qr-code-styling";
import {
  Accordion,
  Box,
  Button,
  ColorInput,
  FileInput,
  Grid,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  Slider,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

type DotType = "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded";
type CornerSquareType = DotType | "dot";
type CornerDotType = DotType | "dot";
type GradientType = "linear" | "radial";
type FileExtension = "png" | "jpeg" | "svg" | "webp";
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type QRMode = "Numeric" | "Alphanumeric" | "Byte" | "Kanji";

interface GradientState {
  enabled: boolean;
  type: GradientType;
  rotation: number;
  color1: string;
  color2: string;
}

interface SectionColorState {
  color: string;
  gradient: GradientState;
}

const defaultGradient: GradientState = {
  enabled: false,
  type: "linear",
  rotation: 0,
  color1: "#000000",
  color2: "#000000",
};

const defaultColor = (color: string): SectionColorState => ({
  color,
  gradient: { ...defaultGradient, color1: color, color2: color },
});

function buildGradient(g: GradientState): Gradient {
  return {
    type: g.type,
    rotation: g.rotation * (Math.PI / 180),
    colorStops: [
      { offset: 0, color: g.color1 },
      { offset: 1, color: g.color2 },
    ],
  };
}

function buildColorOptions(s: SectionColorState) {
  if (s.gradient.enabled) {
    return { gradient: buildGradient(s.gradient) };
  }
  return { color: s.color };
}

const DOT_TYPES: { label: string; value: DotType }[] = [
  { label: "Square", value: "square" },
  { label: "Dots", value: "dots" },
  { label: "Rounded", value: "rounded" },
  { label: "Extra Rounded", value: "extra-rounded" },
  { label: "Classy", value: "classy" },
  { label: "Classy Rounded", value: "classy-rounded" },
];

const CORNER_SQUARE_TYPES: { label: string; value: string }[] = [
  { label: "None", value: "" },
  { label: "Square", value: "square" },
  { label: "Dot", value: "dot" },
  { label: "Extra Rounded", value: "extra-rounded" },
];

const CORNER_DOT_TYPES: { label: string; value: string }[] = [
  { label: "None", value: "" },
  { label: "Square", value: "square" },
  { label: "Dot", value: "dot" },
];

function ColorGradientControls({
  state,
  onChange,
}: {
  state: SectionColorState;
  onChange: (s: SectionColorState) => void;
}) {
  const updateGradient = (patch: Partial<GradientState>) =>
    onChange({ ...state, gradient: { ...state.gradient, ...patch } });

  return (
    <Stack gap="xs">
      <Switch
        label="Gradient"
        checked={state.gradient.enabled}
        onChange={(e) => updateGradient({ enabled: e.currentTarget.checked })}
      />
      {state.gradient.enabled ? (
        <>
          <Group grow>
            <Select
              label="Type"
              data={[
                { label: "Linear", value: "linear" },
                { label: "Radial", value: "radial" },
              ]}
              value={state.gradient.type}
              onChange={(v) => updateGradient({ type: (v as GradientType) || "linear" })}
            />
            <NumberInput
              label="Rotation"
              value={state.gradient.rotation}
              onChange={(v) => updateGradient({ rotation: Number(v) || 0 })}
              min={0}
              max={360}
              suffix="°"
            />
          </Group>
          <Group grow>
            <ColorInput
              label="Color 1"
              value={state.gradient.color1}
              onChange={(v) => updateGradient({ color1: v })}
            />
            <ColorInput
              label="Color 2"
              value={state.gradient.color2}
              onChange={(v) => updateGradient({ color2: v })}
            />
          </Group>
        </>
      ) : (
        <ColorInput
          label="Color"
          value={state.color}
          onChange={(v) => onChange({ ...state, color: v })}
        />
      )}
    </Stack>
  );
}

export function QrEditor() {
  const qrRef = useRef<QRCodeStyling | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Data
  const [data, setData] = useState("https://example.com");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  // Dimensions
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(300);
  const [margin, setMargin] = useState(10);

  // Dots
  const [dotType, setDotType] = useState<DotType>("square");
  const [dotsColor, setDotsColor] = useState<SectionColorState>(defaultColor("#000000"));

  // Corners Square
  const [cornerSquareType, setCornerSquareType] = useState("");
  const [cornersSquareColor, setCornersSquareColor] = useState<SectionColorState>(defaultColor("#000000"));

  // Corners Dot
  const [cornerDotType, setCornerDotType] = useState("");
  const [cornersDotColor, setCornersDotColor] = useState<SectionColorState>(defaultColor("#000000"));

  // Background
  const [bgColor, setBgColor] = useState<SectionColorState>(defaultColor("#ffffff"));

  // Image Options
  const [hideBackgroundDots, setHideBackgroundDots] = useState(true);
  const [imageSize, setImageSize] = useState(0.4);
  const [imageMargin, setImageMargin] = useState(0);

  // QR Options
  const [typeNumber, setTypeNumber] = useState(0);
  const [mode, setMode] = useState<QRMode>("Byte");
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>("Q");

  // Handle image file changes
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setImageUrl(undefined);
  }, [imageFile]);

  const buildOptions = useCallback((): Options => {
    const opts: Options = {
      width,
      height,
      margin,
      data,
      image: imageUrl,
      dotsOptions: { type: dotType, ...buildColorOptions(dotsColor) },
      cornersSquareOptions: {
        ...(cornerSquareType ? { type: cornerSquareType as CornerSquareType } : {}),
        ...buildColorOptions(cornersSquareColor),
      },
      cornersDotOptions: {
        ...(cornerDotType ? { type: cornerDotType as CornerDotType } : {}),
        ...buildColorOptions(cornersDotColor),
      },
      backgroundOptions: { ...buildColorOptions(bgColor) },
      imageOptions: {
        hideBackgroundDots,
        imageSize,
        margin: imageMargin,
      },
      qrOptions: {
        typeNumber: typeNumber as Options["qrOptions"] extends { typeNumber?: infer T } ? T : never,
        mode,
        errorCorrectionLevel: errorCorrection,
      },
    };
    return opts;
  }, [
    width, height, margin, data, imageUrl, dotType, dotsColor,
    cornerSquareType, cornersSquareColor, cornerDotType, cornersDotColor,
    bgColor, hideBackgroundDots, imageSize, imageMargin,
    typeNumber, mode, errorCorrection,
  ]);

  // Initialize QR code instance
  useEffect(() => {
    const qr = new QRCodeStyling(buildOptions());
    qrRef.current = qr;
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      qr.append(containerRef.current);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update QR code when options change
  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.update(buildOptions());
    }
  }, [buildOptions]);

  const handleDownload = (extension: FileExtension) => {
    qrRef.current?.download({ extension, name: "qr-code" });
  };

  return (
    <Box py="md">
      <Title order={2} mb="md">QR Code Editor</Title>
      <Grid gutter="lg">
        {/* Controls Column */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Accordion multiple defaultValue={["data", "dots"]}>
            {/* Data Section */}
            <Accordion.Item value="data">
              <Accordion.Control>Data</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  <TextInput
                    label="URL / Text"
                    value={data}
                    onChange={(e) => setData(e.currentTarget.value)}
                    placeholder="https://example.com"
                  />
                  <FileInput
                    label="Logo Image"
                    accept="image/*"
                    value={imageFile}
                    onChange={setImageFile}
                    clearable
                    placeholder="Upload logo"
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Dimensions */}
            <Accordion.Item value="dimensions">
              <Accordion.Control>Dimensions</Accordion.Control>
              <Accordion.Panel>
                <Group grow>
                  <NumberInput label="Width" value={width} onChange={(v) => setWidth(Number(v) || 300)} min={100} max={1000} />
                  <NumberInput label="Height" value={height} onChange={(v) => setHeight(Number(v) || 300)} min={100} max={1000} />
                  <NumberInput label="Margin" value={margin} onChange={(v) => setMargin(Number(v) || 0)} min={0} max={100} />
                </Group>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Dots Options */}
            <Accordion.Item value="dots">
              <Accordion.Control>Dots Options</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  <Text size="sm" fw={500}>Style</Text>
                  <SegmentedControl
                    fullWidth
                    data={DOT_TYPES}
                    value={dotType}
                    onChange={(v) => setDotType(v as DotType)}
                  />
                  <ColorGradientControls state={dotsColor} onChange={setDotsColor} />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Corners Square Options */}
            <Accordion.Item value="cornersSquare">
              <Accordion.Control>Corners Square Options</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  <Select
                    label="Style"
                    data={CORNER_SQUARE_TYPES}
                    value={cornerSquareType}
                    onChange={(v) => setCornerSquareType(v ?? "")}
                  />
                  <ColorGradientControls state={cornersSquareColor} onChange={setCornersSquareColor} />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Corners Dot Options */}
            <Accordion.Item value="cornersDot">
              <Accordion.Control>Corners Dot Options</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  <Select
                    label="Style"
                    data={CORNER_DOT_TYPES}
                    value={cornerDotType}
                    onChange={(v) => setCornerDotType(v ?? "")}
                  />
                  <ColorGradientControls state={cornersDotColor} onChange={setCornersDotColor} />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Background Options */}
            <Accordion.Item value="background">
              <Accordion.Control>Background Options</Accordion.Control>
              <Accordion.Panel>
                <ColorGradientControls state={bgColor} onChange={setBgColor} />
              </Accordion.Panel>
            </Accordion.Item>

            {/* Image Options */}
            <Accordion.Item value="imageOptions">
              <Accordion.Control>Image Options</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  <Switch
                    label="Hide Background Dots"
                    checked={hideBackgroundDots}
                    onChange={(e) => setHideBackgroundDots(e.currentTarget.checked)}
                  />
                  <Text size="sm" fw={500}>Image Size</Text>
                  <Slider
                    value={imageSize}
                    onChange={setImageSize}
                    min={0}
                    max={1}
                    step={0.1}
                    marks={[
                      { value: 0, label: "0" },
                      { value: 0.5, label: "0.5" },
                      { value: 1, label: "1" },
                    ]}
                  />
                  <NumberInput
                    label="Image Margin"
                    value={imageMargin}
                    onChange={(v) => setImageMargin(Number(v) || 0)}
                    min={0}
                    max={50}
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* QR Options */}
            <Accordion.Item value="qrOptions">
              <Accordion.Control>QR Options</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  <NumberInput
                    label="Type Number"
                    description="0 = auto"
                    value={typeNumber}
                    onChange={(v) => setTypeNumber(Number(v) || 0)}
                    min={0}
                    max={40}
                  />
                  <Select
                    label="Mode"
                    data={[
                      { label: "Numeric", value: "Numeric" },
                      { label: "Alphanumeric", value: "Alphanumeric" },
                      { label: "Byte", value: "Byte" },
                      { label: "Kanji", value: "Kanji" },
                    ]}
                    value={mode}
                    onChange={(v) => setMode((v as QRMode) || "Byte")}
                  />
                  <Text size="sm" fw={500}>Error Correction Level</Text>
                  <SegmentedControl
                    fullWidth
                    data={[
                      { label: "L (Low)", value: "L" },
                      { label: "M (Medium)", value: "M" },
                      { label: "Q (Quartile)", value: "Q" },
                      { label: "H (High)", value: "H" },
                    ]}
                    value={errorCorrection}
                    onChange={(v) => setErrorCorrection(v as ErrorCorrectionLevel)}
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Grid.Col>

        {/* Preview Column */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder p="md" pos="sticky" top={20}>
            <Stack align="center" gap="md">
              <Text fw={600} size="lg">Preview</Text>
              <Box
                ref={containerRef}
                style={{ display: "flex", justifyContent: "center" }}
              />
              <Text fw={600} size="sm" mt="md">Download</Text>
              <Group>
                <Button variant="filled" onClick={() => handleDownload("png")}>PNG</Button>
                <Button variant="filled" onClick={() => handleDownload("jpeg")}>JPEG</Button>
                <Button variant="filled" onClick={() => handleDownload("svg")}>SVG</Button>
                <Button variant="filled" onClick={() => handleDownload("webp")}>WEBP</Button>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
