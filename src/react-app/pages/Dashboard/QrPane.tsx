import { Container, Group, List, Text } from "@mantine/core";
import { QrEditor } from "../../componets/qr.editor";


export function QrPane() {
    return (
        <Container size="xl">
            <Group preventGrowOverflow wrap='nowrap'>
                <List w='30%'>
                    <List.Item>
                        <Text>QR 1</Text>
                    </List.Item>
                    <List.Item>
                        <Text>QR 2</Text>
                    </List.Item>
                    <List.Item>
                        <Text>QR 3</Text>
                    </List.Item>
                </List>
                <QrEditor />
            </Group>
        </Container>
    )
}