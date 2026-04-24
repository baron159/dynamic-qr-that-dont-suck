import { Paper, Text, Typography } from "@mantine/core";
import { QrEditor } from "../componets/qr.editor";


export default function StaticEditor(){

    return (<Paper shadow="xl" withBorder m={24} p={32}>
        <Text component="div" ta={'center'}>
            <Typography>
                <h3>Static Editor</h3>
                <p>
                    Here you can tryout the editor at no cost. These QR codes are NOT dynamic,
                    so changing something in this can result in the whole QR code redrawing
                </p>
            </Typography>
        </Text>
        <QrEditor />
    </Paper>)
}