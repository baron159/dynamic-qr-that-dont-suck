import { Container, Group, List, Text, Button, Stack, Divider } from "@mantine/core";
import { QrEditor } from "../../componets/qr.editor";
import CreditPurchaseKicker from "../../componets/credit.purchase.kicker";
import { useInfo } from "../../contexts/info.ctx";



export function QrPane() {
    const { usedCredits, ownedCredits } = useInfo();

    return (
        <Container size="xl">
            <Group preventGrowOverflow wrap='nowrap'>
                <Stack justify='flex-start' gap={4} ta={'center'}>
                    <CreditPurchaseKicker/>
                    <Text>Credits (used / owned)</Text>
                    <Text>{usedCredits} / {ownedCredits}</Text>
                    <Divider />
                </Stack>
                <QrEditor />
            </Group>
        </Container>
    )
}