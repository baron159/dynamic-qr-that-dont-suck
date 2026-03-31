import { Container } from "@mantine/core";
import { QrEditor } from "../../componets/qr.editor";


export function QrPane() {
    return (
        <Container size="xl">
            <QrEditor />
        </Container>
    )
}