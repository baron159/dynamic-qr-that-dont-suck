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
  Popover,
  SegmentedControl,
  Select,
  Slider,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  ActionIcon
} from "@mantine/core";
import type { Qr } from "pc/browser.ts";
import { useInfo } from '../contexts/info.ctx.tsx';
import { InfoIcon, FloppyDiskBackIcon } from '@phosphor-icons/react';
import { deepCopy } from "../util/obj.ops.ts";

import styles from './qreditor.module.css';

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
  if (!!s.gradient && s.gradient.enabled) {
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
  // { label: "None", value: "" },
  { label: "Square", value: "square" },
  { label: "Dot", value: "dot" },
  { label: "Extra Rounded", value: "extra-rounded" },
];

const CORNER_DOT_TYPES: { label: string; value: string }[] = [
  // { label: "None", value: "" },
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
        checked={state.gradient?.enabled || false}
        onChange={(e) => updateGradient({ enabled: e.currentTarget.checked })}
      />
      {state.gradient?.enabled ? (
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

export interface QrEditorProps {
  disableQrTuningOptions?: boolean;
  disableImgOptions?: boolean;
  disableImage?: boolean;
  qrObj?: Qr;
  showFloatingSave?: boolean;
}

export function QrEditor({ disableQrTuningOptions = true, disableImgOptions = true, disableImage = false, qrObj = undefined, showFloatingSave = false }: QrEditorProps) {
  const qrRef = useRef<QRCodeStyling | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { changeQrStatus, updateQr } = useInfo();

  // Basic Data
  const [data, setData] = useState("https://example.com"); // THIS IS OUR Origin, and CANT be changed
  const [sendTo, setSendTo] = useState("https://example.com"); // This is their data
  const [nickname, setNickname] = useState('');
  const [activated, setActivated] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);  //
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  // Dimensions
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(300);
  const [margin, setMargin] = useState(10);

  // Dots
  const [dotType, setDotType] = useState<DotType>("square");
  const [dotsColor, setDotsColor] = useState<SectionColorState>(defaultColor("#000000"));

  // Corners Square
  const [cornerSquareType, setCornerSquareType] = useState('square');
  const [cornersSquareColor, setCornersSquareColor] = useState<SectionColorState>(defaultColor("#000000"));

  // Corners Dot
  const [cornerDotType, setCornerDotType] = useState("square");
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

  // UI State things
  const whoManipulatedActivation = useRef<'none' | 'effect' | 'user'>('none');

  // Initalization with qrObj
  useEffect(() => {
    if (!qrObj) return; // THIS MAY NEED TO SET DEFAULTS FOR THINGS
    // Set QR object things
    setNickname(qrObj.nickname || '');
    setActivated(qrObj.active || false);
    whoManipulatedActivation.current = 'effect';
    setData(qrObj.kvId);
    setSendTo(qrObj.redirectLink);
    const bb = qrObj.options as Omit<Options, 'nodeCanvas' | 'jsDom'>;
    // FIGURE OUT HOW TO HANDLE THE URL SO ITS NOT CONFUSING
    setWidth(bb?.width as number || 300);
    setHeight(bb?.height as number || 300);
    setMargin(bb?.margin as number || 10);
    // Dots
    setDotType(bb?.dotsOptions?.type as DotType || 'square');
    // @ts-ignore
    if (!!bb && 'gradient' in bb.dotsOptions!) bb.dotsOptions.gradient['enabled'] = true;
    // @ts-ignore
    setDotsColor(!!bb ? buildColorOptions(bb?.dotsOptions) : defaultColor('#000000'));

    // Corners Square
    setCornerSquareType(bb?.cornersSquareOptions?.type || 'square');
    // @ts-ignore
    if (!!bb && 'gradient' in bb.cornersSquareOptions!) bb.cornersSquareOptions!.gradient['enabled'] = true;
    // @ts-ignore
    setCornersSquareColor(!!bb ? buildColorOptions(bb?.cornersSquareOptions) : defaultColor('#000000'));

    // Corner Dot
    setCornerDotType(bb?.cornersDotOptions?.type || 'square');
    // @ts-ignore
    if (!!bb && 'gradient' in bb.cornersDotOptions) bb.cornersDotOptions.gradient['enabled'] = true;
    // @ts-ignore
    setCornersDotColor(!!bb ? buildColorOptions(bb?.cornersDotOptions) : defaultColor('#000000'));

    // Background
    //@ts-ignore
    if (!!bb && 'gradient' in bb.backgroundOptions) bb.backgroundOptions.gradient['enabled'] = true;
    // @ts-ignore
    setBgColor(!!bb ? buildColorOptions(bb?.backgroundOptions) : defaultColor('#ffffff'));

    // Image Options
    setHideBackgroundDots(bb?.imageOptions?.hideBackgroundDots || true);
    setImageSize(bb?.imageOptions?.imageSize || 0.4);
    setImageMargin(bb?.imageOptions?.margin || 0);

    // QR Options
    setTypeNumber(bb?.qrOptions?.typeNumber || 0);
    setMode(bb?.qrOptions?.mode || "Byte");
    setErrorCorrection(bb?.qrOptions?.errorCorrectionLevel || "Q");

  }, [qrObj])

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
      data,  // will match url in kvId
      image: imageUrl,
      shape: 'square', // This opt currently has no controller
      type: 'canvas',  // This opt currently has no controller
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

  useEffect(() => {
    if (whoManipulatedActivation.current !== 'user') return;
    else if (!qrObj) return;
    changeQrStatus(qrObj.id, activated)
      .then(rtn => {
        if (!rtn) {
          whoManipulatedActivation.current = 'effect';
          setActivated(prev => !prev); // Change failed. Flip the state.
        }
      })
      .catch(r => {
        console.log(`Caught an error:: ${r}`)
        whoManipulatedActivation.current = 'effect';
        setActivated(prev => !prev); // Change failed. Flip the state.
      })
  }, [activated])

  // Update QR code when options change
  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.update(buildOptions());
    }
  }, [buildOptions]);

  useEffect(() => {
    if(!!sendTo && !qrObj){
      setData(sendTo)
    }
  }, [sendTo])

  const handleDownload = (extension: FileExtension) => {
    qrRef.current?.download({ extension, name: `${nickname.replace(' ', '_')}` });
  };

  const handleSave = async () => {
    if (!qrObj) return; // No QR object present
    const baseValues = deepCopy(qrObj, 'createdAt', 'active', 'kvId', 'scanCount', 'updatedAt', 'userId', 'creditId');
    // TEMP LINE because we don't save images currently
    baseValues.options = deepCopy(buildOptions(), 'image');
    baseValues.redirectLink = sendTo;
    baseValues.nickname = nickname;
    await updateQr(baseValues.id, baseValues);
  }

  return (
    <Box py="md">
      {!!showFloatingSave && <ActionIcon size={64} radius={32} className={styles.floatingSaveBtn} onClick={handleSave}>
        <FloppyDiskBackIcon weight="duotone" size={48} />
      </ActionIcon>}
      <Group justify="space-between" wrap='nowrap'>
        <Title order={2} mb="md" flex={1}>QR Code Editor</Title>
        { !!qrObj && <Button
          flex={1}
          onClick={handleSave}
          leftSection={<FloppyDiskBackIcon weight='duotone' size={28} />}
        >
          Save
        </Button>}
      </Group>
      <Grid>
        {/* Controls Column */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Accordion multiple defaultValue={["data"]}>
            {/* Data Section */}
            <Accordion.Item value="data">
              <Accordion.Control>Basic</Accordion.Control>
              <Accordion.Panel>
                <Text ta='center' mb='1.2rem' c='dimmed'>
                  The most important information. QR data, activation status, and a nickname for your refrence!
                </Text>
                <Stack gap="sm">
                  { !!qrObj && <TextInput
                    label="Nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.currentTarget.value)}
                    placeholder="My Site"
                  />}
                  <TextInput
                    label="URL"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.currentTarget.value)}
                    placeholder="https://example.com"
                  />
                  {/* *** The activation is a dynamic QR option *** */}
                  {!!qrObj && <><Text size="1.1rem">Activation Status</Text>
                    <Group justify="space-between">
                      <Switch
                        label={`is ${activated ? 'active' : 'deactive'}`}
                        size="lg"
                        checked={activated}
                        onChange={(e) => {
                          whoManipulatedActivation.current = 'user'
                          setActivated(e.currentTarget.checked);
                        }}
                      />
                      <Popover withArrow width={350}>
                        <Popover.Target><InfoIcon size={32} weight="duotone" /></Popover.Target>
                        <Popover.Dropdown>
                          <Text>
                            An active QR will consume a credit and enable the location you provided above. Taking users that scan your QR to the route. Make sure your route
                            is valid otherwise users will see a 404 error. Scanning a deactivated QR will also result in a 404.
                            <br /><br />
                            Deactivating the QR will free up the credit,
                            allowing you to activate a different QR code.
                          </Text>
                        </Popover.Dropdown>
                      </Popover>
                    </Group></>}
                  <Group justify="space-between" wrap="nowrap">
                    <FileInput
                      label="Logo Image"
                      accept="image/*"
                      value={imageFile}
                      onChange={setImageFile}
                      clearable
                      placeholder="Upload logo"
                      hidden={disableImage}
                      w={'85%'}
                    />
                    <Popover withArrow width={350}>
                      <Popover.Target><InfoIcon size={32} weight="duotone" /></Popover.Target>
                      <Popover.Dropdown>
                        <Text>
                          Currently, we do NOT save images on our server. So the image will disappear if your refresh the page or move to a different computer. However,
                          you can still add an images and download the QR with the logo applied.
                          <br /><br />
                          We are working to add the ability to save the image
                        </Text>
                      </Popover.Dropdown>
                    </Popover>
                  </Group>

                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Dimensions */}
            <Accordion.Item value="dimensions">
              <Accordion.Control>Dimensions</Accordion.Control>
              <Accordion.Panel>
                <Text ta='center' mb='1.2rem' c='dimmed'>
                  The max preview size is 350 x 350, but your dimensions are applied when you download the
                  QR via the buttons below the preview.
                </Text>
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
                <Text ta='center' mb='1.2rem' c='dimmed'>
                  These settings apply to all dots that make up the
                  actually data of the QR code. Be cautious of colors combinations,
                  if you can't see the dots it's likely the camera won't either.
                </Text>
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
                <Text ta='center' mb='1.2rem' c='dimmed'>
                  The style of the 3 corner outter most squares.
                  Be cautious of colors combinations,
                  if you can't see the dots it's likely the camera won't either.
                </Text>
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
                <Text ta='center' mb='1.2rem' c='dimmed'>
                  The style of the 3 corner inner most squares/dots.
                  Be cautious of colors combinations,
                  if you can't see the dots it's likely the camera won't either.
                </Text>
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
                <Text ta='center' mb='1.2rem' c='dimmed'>
                  Incase this isn't clear, this effects the background color of the QR code.
                </Text>
                <Text ta='center' mb='1.2rem' c='dimmed'>
                  Note: There is a potential bug, were background colors don't take effect.
                  Save & refresh the page, and the proper background should be active.
                  We are working to resolve this issue.
                </Text>
                <ColorGradientControls state={bgColor} onChange={setBgColor} />
              </Accordion.Panel>
            </Accordion.Item>

            {/* Image Options */}
            <Accordion.Item value="imageOptions" hidden={disableImgOptions}>
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
            <Accordion.Item value="qrOptions" hidden={disableQrTuningOptions}>
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
                className={styles.canvasBox}
              />
              <Text fw={600} size="sm" mt="md">Download</Text>
              <Group>
                <Button variant="light" onClick={() => handleDownload("png")}>PNG</Button>
                <Button variant="light" onClick={() => handleDownload("jpeg")}>JPEG</Button>
                <Button variant="light" onClick={() => handleDownload("svg")}>SVG</Button>
                <Button variant="light" onClick={() => handleDownload("webp")}>WEBP</Button>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
