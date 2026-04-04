import { Container, Group, List, Text, Button, Stack } from "@mantine/core";
import { QrEditor } from "../../componets/qr.editor";
import CreditPurchaseKicker from "../../componets/credit.purchase.kicker";


export function QrPane() {



    return (
        <Container size="xl">
            <Group preventGrowOverflow wrap='nowrap'>
                <CreditPurchaseKicker/>
                <QrEditor />
            </Group>
        </Container>
    )
}