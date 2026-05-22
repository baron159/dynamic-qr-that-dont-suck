import {
    Container,
    Title,
    Text,
    Button,
    Group,
    Stack,
    Card,
    SimpleGrid,
    Badge,
    Box,
    ThemeIcon,
    Divider,
    Accordion,
    List,
    SegmentedControl,
    rem,
} from "@mantine/core";
import { useLocation } from "wouter";
import { useState, type ReactNode } from "react";
import {
    QrCodeIcon,
    LightningIcon,
    CloudArrowUpIcon,
    PencilSimpleIcon,
    ChartLineIcon,
    ShieldCheckIcon,
    InfinityIcon,
    CheckIcon,
    ArrowRightIcon,
    CurrencyDollarIcon,
    SparkleIcon,
} from "@phosphor-icons/react";
import { useAuth } from "../contexts/auth.ctx";

type Billing = "oneTime" | "monthly" | "yearly";

export default function Landing() {
    const [, nav] = useLocation();
    const { isAuthenticated } = useAuth();
    const [billing, setBilling] = useState<Billing>("monthly");

    const goPrimary = () => nav(isAuthenticated ? "/dashboard" : "/login");
    const goTry = () => nav("/static-editor");

    return (
        <Box>
            {/* HERO */}
            <Box
                py={{ base: 56, md: 96 }}
                style={{
                    background:
                        "radial-gradient(ellipse at top, var(--mantine-color-blue-light) 0%, transparent 60%)",
                }}
            >
                <Container size="lg">
                    <Stack align="center" gap="lg" ta="center">
                        <Badge
                            size="lg"
                            variant="light"
                            color="blue"
                            leftSection={<SparkleIcon size={14} weight="fill" />}
                        >
                            Dynamic QR codes that actually don't suck
                        </Badge>
                        <Title
                            order={1}
                            style={{ fontSize: rem(56), lineHeight: 1.05, maxWidth: 820 }}
                        >
                            Print once. Update forever.
                        </Title>
                        <Text size="xl" c="dimmed" maw={680}>
                            Change the destination of any printed QR code without reprinting a single
                            poster, card, or shirt. Pay once per code or go unlimited — at a fraction
                            of what the other guys charge.
                        </Text>
                        <Group mt="md">
                            <Button
                                size="lg"
                                onClick={goPrimary}
                                rightSection={<ArrowRightIcon size={18} weight="bold" />}
                            >
                                {isAuthenticated ? "Go to Dashboard" : "Get started"}
                            </Button>
                            <Button size="lg" variant="default" onClick={goTry}>
                                Try the editor — free
                            </Button>
                        </Group>
                        <Group gap="xl" mt="sm" c="dimmed">
                            <Group gap={6}>
                                <CheckIcon size={16} weight="bold" />
                                <Text size="sm">No subscription required</Text>
                            </Group>
                            <Group gap={6}>
                                <CheckIcon size={16} weight="bold" />
                                <Text size="sm">Codes you own for life</Text>
                            </Group>
                            <Group gap={6}>
                                <CheckIcon size={16} weight="bold" />
                                <Text size="sm">Robust Editor</Text>
                            </Group>
                        </Group>
                    </Stack>
                </Container>
            </Box>

            {/* VALUE PROP */}
            <Container size="lg" py={{ base: 48, md: 80 }}>
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48} verticalSpacing={48}>
                    <Stack gap="md">
                        <Badge variant="light" color="grape" w="fit-content">
                            Why bother?
                        </Badge>
                        <Title order={2}>A QR code shouldn't expire when your contract does.</Title>
                        <Text c="dimmed" size="lg">
                            Most "dynamic" QR services lock your code behind a recurring fee. Stop
                            paying, lose the code. We do it differently — buy a code once and it's
                            yours, or subscribe for unlimited codes plus the fancy stuff.
                        </Text>
                        <List
                            spacing="sm"
                            icon={
                                <ThemeIcon color="teal" size={22} radius="xl">
                                    <CheckIcon size={14} weight="bold" />
                                </ThemeIcon>
                            }
                        >
                            <List.Item>Edit the destination URL anytime</List.Item>
                            <List.Item>Fully styled QR codes (colors, gradients, logos)</List.Item>
                            <List.Item>Pass-through data for context-aware redirects with premium</List.Item>
                            <List.Item>Host files behind a code with our premium plan</List.Item>
                        </List>
                    </Stack>
                    <Card withBorder radius="lg" p="xl" shadow="sm">
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text fw={600}>The other guys</Text>
                                <Text fw={600}>Us</Text>
                            </Group>
                            <Divider />
                            <CompareRow left="$20/mo per code" right="$20 once per code" />
                            <CompareRow left="Code dies if you cancel" right="Yours forever" />
                            <CompareRow left="Watermarked free tier" right="Clean styled codes" />
                            <CompareRow
                                left="Pricey 'enterprise' tiers for file hosting"
                                right="$9.95/mo unlimited + 1 GB per code"
                            />
                            <Divider />
                            <Text c="teal" fw={600} ta="center">
                                Save $220+ in your first year, compared to the other guys
                            </Text>
                        </Stack>
                    </Card>
                </SimpleGrid>
            </Container>

            {/* FEATURES */}
            <Box bg="var(--mantine-color-default-hover)" py={{ base: 48, md: 80 }}>
                <Container size="lg">
                    <Stack align="center" ta="center" mb="xl">
                        <Badge variant="light" color="blue">
                            Features
                        </Badge>
                        <Title order={2}>Everything a dynamic QR should do</Title>
                        <Text c="dimmed" size="lg" maw={620}>
                            All the table-stakes features, plus a few you won't find elsewhere.
                        </Text>
                    </Stack>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                        <Feature
                            icon={<PencilSimpleIcon size={22} weight="duotone" />}
                            title="Edit anytime"
                            desc="Repoint a printed code to a new URL in seconds. The QR never changes — your destination does."
                        />
                        <Feature
                            icon={<LightningIcon size={22} weight="duotone" />}
                            title="Dynamicly-dynamic*"
                            desc="Pass parameters through the redirect for unique-scan tracking, date-driven links, and more."
                        />
                        <Feature
                            icon={<CloudArrowUpIcon size={22} weight="duotone" />}
                            title="File hosting*"
                            desc="Premium codes can host up to 1 GB of files each. Menus, PDFs, downloads — just drop them in."
                        />
                        <Feature
                            icon={<QrCodeIcon size={22} weight="duotone" />}
                            title="Fully styled"
                            desc="Custom colors, gradients, dot styles, corner shapes, and logos. Export PNG, SVG, JPEG, or WebP."
                        />
                        <Feature
                            icon={<ChartLineIcon size={22} weight="duotone" />}
                            title="Built to scale"
                            desc="Running on Cloudflare's edge — your scans resolve fast from anywhere in the world."
                        />
                        <Feature
                            icon={<ShieldCheckIcon size={22} weight="duotone" />}
                            title="Yours to keep"
                            desc="One-time credits don't expire. Cancel a subscription and your one-time codes keep working."
                        />
                    </SimpleGrid>
                    <Text c='dimmed' ta={'center'}>* Coming soon, Premium features</Text>
                </Container>
            </Box>

            {/* PRICING */}
            <Container size="lg" py={{ base: 48, md: 80 }} id="pricing">
                <Stack align="center" ta="center" mb="xl">
                    <Badge variant="light" color="teal">
                        Pricing
                    </Badge>
                    <Title order={2}>Simple, honest pricing</Title>
                    <Text c="dimmed" size="lg" maw={620}>
                        Buy a code outright, or go unlimited with a subscription. No seats, no
                        gotchas.
                    </Text>
                    <SegmentedControl
                        mt="sm"
                        value={billing}
                        onChange={(v) => setBilling(v as Billing)}
                        data={[
                            { label: "One-time", value: "oneTime" },
                            { label: "Monthly", value: "monthly" },
                            { label: "Yearly (save 17%)", value: "yearly" },
                        ]}
                    />
                </Stack>

                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                    <PriceCard
                        name="Free editor"
                        price="$0"
                        cadence="forever"
                        description="Design and download QR codes without an account. Great for static use cases."
                        features={[
                            "Full QR styling editor",
                            "PNG / SVG / JPEG / WebP export",
                            "No watermark",
                        ]}
                        ctaLabel="Open the editor"
                        onCta={goTry}
                        variant="default"
                    />

                    <PriceCard
                        name="Basic credit"
                        price={billing === "oneTime" ? "$20" : "$20"}
                        cadence={billing === "oneTime" ? "one-time, per code" : "one-time, per code"}
                        description="A single dynamic QR code you own forever. Perfect for cards, posters, signage."
                        features={[
                            "1 dynamic QR code",
                            "Edit the destination anytime",
                            "Bulk discounts on multiple credits",
                            "No file hosting",
                        ]}
                        ctaLabel={isAuthenticated ? "Buy a credit" : "Sign up to buy"}
                        onCta={goPrimary}
                        variant="default"
                        highlight={billing === "oneTime"}
                    />

                    <PriceCard
                        name="Premium"
                        price={billing === "yearly" ? "$99" : "$9.95"}
                        cadence={billing === "yearly" ? "per year" : "per month"}
                        description="Unlimited premium codes with file hosting and every future feature we ship."
                        features={[
                            "Unlimited premium dynamic codes",
                            "Up to 1 GB file hosting per code",
                            "Dynamicly-dynamic redirects",
                            "All future features included",
                            "Cancel anytime",
                        ]}
                        ctaLabel={
                            isAuthenticated
                                ? billing === "yearly"
                                    ? "Start yearly plan"
                                    : "Start monthly plan"
                                : "Sign up for premium"
                        }
                        onCta={goPrimary}
                        variant="filled"
                        highlight={billing !== "oneTime"}
                    />
                </SimpleGrid>

                <Text ta="center" c="dimmed" size="sm" mt="lg">
                    Need more than 1 GB on a code?{" "}
                    <Text component="span" fw={500}>
                        Reach out — we'll work something out.
                    </Text>
                </Text>
            </Container>

            {/* FAQ */}
            <Box bg="var(--mantine-color-default-hover)" py={{ base: 48, md: 80 }}>
                <Container size="sm">
                    <Stack align="center" ta="center" mb="lg">
                        <Badge variant="light" color="grape">
                            FAQ
                        </Badge>
                        <Title order={2}>Questions, answered</Title>
                    </Stack>
                    <Accordion variant="separated" radius="md">
                        <Accordion.Item value="dynamic">
                            <Accordion.Control>What is a dynamic QR code?</Accordion.Control>
                            <Accordion.Panel>
                                A QR code with a fixed image but a destination you can change later.
                                Print it on anything; we'll handle the redirect. Update the
                                destination URL whenever you want, no reprint required.
                            </Accordion.Panel>
                        </Accordion.Item>
                        <Accordion.Item value="basic-vs-premium">
                            <Accordion.Control>
                                What's the difference between a basic credit and a premium code?
                            </Accordion.Control>
                            <Accordion.Panel>
                                A basic credit ($20 one-time) activates a single dynamic QR with
                                URL redirects. Premium codes (included with the subscription) add
                                file hosting (up to 1 GB per code) and any future features we
                                ship — pass-through data, advanced redirects, and more.
                            </Accordion.Panel>
                        </Accordion.Item>
                        <Accordion.Item value="cancel">
                            <Accordion.Control>
                                What happens to my codes if I cancel the subscription?
                            </Accordion.Control>
                            <Accordion.Panel>
                                Any codes you bought with one-time credits keep working forever —
                                you own them. Premium-only features (like file hosting) pause until
                                you resubscribe.
                            </Accordion.Panel>
                        </Accordion.Item>
                        <Accordion.Item value="how-many">
                            <Accordion.Control>
                                I need a lot of codes. Which plan is for me?
                            </Accordion.Control>
                            <Accordion.Panel>
                                If you need more than ~5 codes, the $9.95/month subscription pays
                                for itself immediately and unlocks unlimited codes plus premium
                                features. The yearly plan ($99) saves you another ~17%.
                            </Accordion.Panel>
                        </Accordion.Item>
                        <Accordion.Item value="try">
                            <Accordion.Control>
                                Can I try before I pay?
                            </Accordion.Control>
                            <Accordion.Panel>
                                Yes — the{" "}
                                <Text
                                    component="span"
                                    c="blue"
                                    style={{ cursor: "pointer" }}
                                    onClick={goTry}
                                    fw={500}
                                >
                                    static editor
                                </Text>{" "}
                                is free with no signup. You get the full styling experience and can
                                export the result. You just won't be able to edit the destination
                                later without a dynamic credit.
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                </Container>
            </Box>

            {/* CTA */}
            <Container size="md" py={{ base: 48, md: 80 }}>
                <Card
                    withBorder
                    radius="lg"
                    p={{ base: "xl", md: 48 }}
                    style={{
                        background:
                            "linear-gradient(135deg, var(--mantine-color-blue-light) 0%, var(--mantine-color-grape-light) 100%)",
                    }}
                >
                    <Stack align="center" ta="center" gap="md">
                        <ThemeIcon size={56} radius="xl" variant="white" color="blue">
                            <InfinityIcon size={28} weight="duotone" />
                        </ThemeIcon>
                        <Title order={2}>Make a code that lasts as long as you do.</Title>
                        <Text c="dimmed" size="lg" maw={520}>
                            Twenty bucks, one code, yours forever. Or go unlimited for the price of
                            a sandwich a month.
                        </Text>
                        <Group mt="sm">
                            <Button
                                size="lg"
                                onClick={goPrimary}
                                rightSection={<ArrowRightIcon size={18} weight="bold" />}
                            >
                                {isAuthenticated ? "Open dashboard" : "Create your account"}
                            </Button>
                            <Button
                                size="lg"
                                variant="default"
                                leftSection={<CurrencyDollarIcon size={18} weight="duotone" />}
                                onClick={() => {
                                    document
                                        .getElementById("pricing")
                                        ?.scrollIntoView({ behavior: "smooth" });
                                }}
                            >
                                See pricing
                            </Button>
                        </Group>
                    </Stack>
                </Card>
            </Container>
        </Box>
    );
}

function CompareRow({ left, right }: { left: string; right: string }) {
    return (
        <Group justify="space-between" align="flex-start">
            <Text c="dimmed" style={{ textDecoration: "line-through" }} maw={"45%"}>
                {left}
            </Text>
            <Text fw={500} ta="right" maw={"45%"}>
                {right}
            </Text>
        </Group>
    );
}

function Feature({
    icon,
    title,
    desc,
}: {
    icon: ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <Card withBorder radius="md" p="lg" h="100%">
            <Stack gap="sm">
                <ThemeIcon size={42} radius="md" variant="light" color="blue">
                    {icon}
                </ThemeIcon>
                <Text fw={600} size="lg">
                    {title}
                </Text>
                <Text c="dimmed" size="sm">
                    {desc}
                </Text>
            </Stack>
        </Card>
    );
}

function PriceCard({
    name,
    price,
    cadence,
    description,
    features,
    ctaLabel,
    onCta,
    variant,
    highlight,
}: {
    name: string;
    price: string;
    cadence: string;
    description: string;
    features: string[];
    ctaLabel: string;
    onCta: () => void;
    variant: "default" | "filled";
    highlight?: boolean;
}) {
    return (
        <Card
            withBorder
            radius="lg"
            p="xl"
            shadow={highlight ? "lg" : "sm"}
            style={{
                borderColor: highlight ? "var(--mantine-primary-color-filled)" : undefined,
                borderWidth: highlight ? 2 : undefined,
                position: "relative",
            }}
        >
            {highlight && (
                <Badge
                    color="var(--mantine-primary-color-filled)"
                    style={{ position: "absolute", top: 0, right: 16 }}
                >
                    Selected
                </Badge>
            )}
            <Stack gap="md" h="100%" justify="space-between">
                <Stack gap="sm">
                    <Text fw={600} size="lg">
                        {name}
                    </Text>
                    <Group gap={6} align="baseline">
                        <Title order={2}>{price}</Title>
                        <Text c="dimmed" size="sm">
                            {cadence}
                        </Text>
                    </Group>
                    <Text c="dimmed" size="sm">
                        {description}
                    </Text>
                    <Divider my="xs" />
                    <List
                        spacing={6}
                        icon={
                            <ThemeIcon color="teal" size={18} radius="xl">
                                <CheckIcon size={12} weight="bold" />
                            </ThemeIcon>
                        }
                    >
                        {features.map((f) => (
                            <List.Item key={f}>
                                <Text size="sm">{f}</Text>
                            </List.Item>
                        ))}
                    </List>
                </Stack>
                <Button
                    fullWidth
                    size="md"
                    variant={variant === "filled" ? "filled" : "default"}
                    onClick={onCta}
                    mt="md"
                >
                    {ctaLabel}
                </Button>
            </Stack>
        </Card>
    );
}
