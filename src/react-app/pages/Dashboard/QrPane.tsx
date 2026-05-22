import { Group, Grid, Text, Button, Stack, Divider, TextInput } from "@mantine/core";
import { QrEditor } from "../../componets/qr.editor";
import CreditPurchaseKicker from "../../componets/credit.purchase.kicker";
import { useInfo } from "../../contexts/info.ctx";
import { useState } from "react";
import { Qr } from "pc/browser.ts";
import { PlusIcon } from '@phosphor-icons/react';
import { useInputState } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";


export function QrPane() {
    const { usedCredits, ownedCredits, createQr, isBusy, qrList, isMonthlySuber } = useInfo();
    const [selectedQr, setSelectedQr] = useState<Qr | null>(null);

    // New QR controls
    const [newQrLink, setNewQrLink] = useInputState('');
    const [newQrNickname, setNewQrNickname] = useInputState('');

    const createNewQr = () => {
        return (<Stack h={'100%'} align="center" justify="center">
            <Text mb={'-14px'}>Create New QR</Text>
            <PlusIcon size={'2rem'} />
            <TextInput label='Link to' placeholder="https://example.com" value={newQrLink} onChange={setNewQrLink} />
            <TextInput label='Nickname' placeholder="QR to Homepage" value={newQrNickname} onChange={setNewQrNickname} />
            <Button loading={isBusy} onClick={() => {
                createQr(newQrLink, newQrNickname)
                    .then(() => {
                        setNewQrLink('');
                        setNewQrNickname('');
                    })
            }} disabled={!newQrLink}>Create New QR</Button>
        </Stack>)
    }

    const selectQrObj = (id: string) => {
        const qr = qrList.filter(q => q.id === id);
        if (qr.length === 0 || qr.length > 1) {
            notifications.show({
                message: "Unable to determine selected QR, something isn't right. Try refreshing and trying again.",
                color: 'red',
                autoClose: 10_000
            });
            setSelectedQr(null);
            return;
        }
        setSelectedQr(qr[0]);
    }

    const qrListView = () => qrList.map(q => {
        let firstLine: string;
        if (!!q.nickname) firstLine = q.nickname
        else {
            const temp = new URL(q.redirectLink);
            firstLine = temp.hostname;
        }
        return (<><Group justify='space-between' wrap='nowrap' key={q.id} id={q.id}>
            <Stack gap={0} align="start" ta={'start'}>
                <Text size='lg' truncate={'end'} w={{ base: 100, md: 120, lg: 160 }}>{firstLine}</Text>
                <Text size='md' c='dimmed' truncate={'end'} w={{ base: 100, md: 120, lg: 160 }}>{q.redirectLink}</Text>
            </Stack>
            <Group gap={12} wrap="nowrap" justify='right'>
                <Text c={q.active ? 'green' : 'orange'}>{q.active ? 'ON' : 'OFF'}</Text>
                <Button onClick={() => selectQrObj(q.id)} variant={selectedQr?.id === q.id ? 'filled' : 'outline'}>Select</Button>
            </Group>
        </Group>
            <Divider ml={'2rem'} size={'sm'} />
        </>)
    })

    const creditInfo = () => {
        return (<Group justify='space-between' wrap="nowrap" mt={'12px'} mb={'8px'}>
            <Stack ta='center' gap={0}>
                <Text c='dimmed'>Total QRs</Text>
                <Text size={'1.4rem'}>{qrList.length}</Text>
            </Stack>
            <Stack ta='center' gap={0}>
                <Text c='dimmed'>Credits (used / owned)</Text>
                <Text size="1.4rem">{usedCredits} / {ownedCredits}</Text>
                {isMonthlySuber && <Text c='yellow'>You are a Monthly Subscriber</Text>}
            </Stack>
            <Button leftSection={<PlusIcon />} onClick={() => setSelectedQr(null)} 
                disabled={!selectedQr} variant={!selectedQr ? 'filled' : 'light'}
            >
                Create
            </Button>
        </Group>)
    }

    return (<Grid py='1rem'>
        
        <Grid.Col span={{base: 5, md: 4, lg: 3}}>
            <Stack justify='center' gap={4} ta={'center'}>
                <CreditPurchaseKicker />
                {creditInfo()}
                <Divider size={'md'} />
                {qrListView()}
            </Stack>
        </Grid.Col>
        <Grid.Col span={'content'}>
            <Divider h='100%' size={'lg'} orientation="vertical" />
        </Grid.Col>
        <Grid.Col span={{base: 6, md: 7, lg: 8}}>
            {selectedQr ? <QrEditor qrObj={selectedQr} showFloatingSave /> : createNewQr()}

        </Grid.Col>
    </Grid>)
}