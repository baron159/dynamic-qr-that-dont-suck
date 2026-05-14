import { Container, TextInput, Title, Text, Group, Button } from "@mantine/core";
import { useInfo } from "../../contexts/info.ctx";
import { useEffect, useState } from "react";
import { useInputState } from "@mantine/hooks";
import { FloppyDiskBackIcon } from "@phosphor-icons/react";
import { SubmitSupportTicket } from "../../componets/support.modal";
import { useAuth } from "../../contexts/auth.ctx";

export function AccountPane() {
    const { user, updateUser, billingPortal } = useInfo();
    const { injectHeader } = useAuth();

    const [name, setName] = useInputState('');
    const [phone, setPhone] = useInputState('');
    const [supportMod, setSupportFlag] = useState(false);
    if (!user) {
        return (<Text>No user signed in!</Text>)
    }

    useEffect(()=> {
        if(!user) return;
        setName(user.name);
        setPhone(user.phone || '')
    }, [user])

    const disableSave = () => {
        if (user.name !== name) return false;
        if (user.phone !== phone) return false;
        return true;
    }

    const handleSave = async () => {
        const rtn: { [key: string]: string } = {};
        if (name !== user.name) rtn.name = name;
        if (phone !== user.phone) rtn.phone = phone;
        await updateUser(rtn);

    }

    const startSubscription = async () => {
        const req = new Request('/api/auth/monthly/purchase');
        injectHeader(req);
        const res = await fetch(req);
        if (res.status === 200) {
            const b = await res.json() as { url: string };
            window.location.href = b.url;
        } else {
            console.error(res.statusText);
        }
    }

    // a "more robust" new tab open
    const gotoManageSubscription = () => {
        const link = document.createElement('a');
        link.href = billingPortal;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';  // security
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (<>
        <SubmitSupportTicket showModel={supportMod} onClose={() => { setSupportFlag(false) }} />
        <Container>
            <Title order={3}>Account</Title>
            <Text c={'dimmed'}>Your User ID: <Text span c='purple' size='1.2rem'>{user.id}</Text> can be handy sending with support messages</Text>
            <TextInput
                label='Email'
                readOnly
                value={user?.email}
                description="At this time, you can't change the Email. We are working to change this. This is also how you login"
            />
            <TextInput
                value={name} onChange={setName}
                label="Name"
                description="What we should call you in support messages and on the system"
            />
            <TextInput
                value={phone} onChange={setPhone}
                label='Phone'
                description="If you want to be called with support messages instead of email. We will call you here."
            />
            <Button
                variant='light'
                fullWidth
                mt={'lg'}
                disabled={disableSave()}
                onClick={handleSave}
                leftSection={<FloppyDiskBackIcon weight="duotone" size={28} />}>
                Save
            </Button>
            <Text size='1.2rem' ta='center' mt='1rem'>
                Monthy subscription is
                <Text span size="1.8rem" c={!!user.monthlySubscription ? 'green' : 'orange'} ml={6}>{!!user.monthlySubscription ? 'Active' : 'deactivated'}</Text>
            </Text>
            <Button fullWidth onClick={!!user.monthlySubscription ? gotoManageSubscription : startSubscription}>
                {!!user.monthlySubscription ? 'Manage Subscription' : 'Start Subscription ($9.95 per month -or- $99 for the year)'}
            </Button>
            <Group justify="space-evenly" mt={'2rem'}>
                <Button color='orange'>Change Password</Button>
                <Button onClick={() => setSupportFlag(true)}>Support Form</Button>
            </Group>
        </Container>
    </>)
}