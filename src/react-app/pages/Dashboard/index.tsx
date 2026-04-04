import { Title, Card, Tabs, Text, Group } from "@mantine/core";
import { AccountPane } from "./Account";
import { QrPane } from "./QrPane";


export function Dashboard() {

    return (<Card w={{ base: '95%', md: '90%', lg: '80%' }} mx="auto" withBorder mt="2rem">
        <Title order={1}>Dashboard</Title>
        <Tabs defaultValue={'qr'}>
            <Tabs.List>
                <Tabs.Tab value="qr">QRs</Tabs.Tab>
                <Tabs.Tab value="static">Static QRs Editor</Tabs.Tab>
                <Tabs.Tab value="account">Account</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="account">
                <AccountPane />
            </Tabs.Panel>
            <Tabs.Panel value="qr">
                <QrPane />
            </Tabs.Panel>
        </Tabs>
    </Card>)
}