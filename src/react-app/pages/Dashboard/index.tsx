import { Title, Card, Tabs, Text, Group } from "@mantine/core";
import { AccountPane } from "./Account";
import { QrPane } from "./QrPane";


export function Dashboard() {

    return (<Card w={{ base: '100%', sm: '95%', md: '90%', lg: '85%' }} mx="auto" withBorder mt={{ base: '0.5rem', sm: '2rem' }} p={{ base: 'sm', sm: 'md' }}>
        <Title order={1}>Dashboard</Title>
        <Tabs defaultValue={'qr'}>
            <Tabs.List grow>
                <Tabs.Tab value="qr">QRs</Tabs.Tab>
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