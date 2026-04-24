import { useDisclosure, useInputState } from '@mantine/hooks';
import { Modal, Button, Radio, Group, Card, Text, Textarea } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth.ctx';
import { notifications } from '@mantine/notifications';

interface SupportTicketModelParams { showModel: boolean, onClose: () => void }

export function SubmitSupportTicket(params: SupportTicketModelParams) {
    const { injectHeader } = useAuth();
    const [opened, { open, close }] = useDisclosure(params.showModel);
    const [prefCont, setPrefCont] = useState<'phone' | 'email' | 'text'>('email');
    const [msg, setMsg] = useInputState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!!params.showModel) open();
    }, [params.showModel]);

    const sendHandler = async () => {
        setBusy(true)
        const req = new Request('/api/auth/support/ticket', {
            method: 'POST',
            body: JSON.stringify({ mthd: prefCont, msg })
        });
        injectHeader(req);
        const res = await fetch(req);
        if (res.status === 200) {
            notifications.show({ message: 'Support Ticket Sent!' });
            close();
        } else {
            notifications.show({ message: 'Issue sending, please try again', color: 'orange' });
        }
        setBusy(false)

    }

    return (
        <>
            <Modal opened={opened} onClose={() => {
                params.onClose();
                close()
            }} title="Get Support" centered>
                <Card>
                    <Text size='1.6rem'>Open a Support Tick</Text>
                    <Text size='md' component='p'>
                        Need to ask a question, or something not working the way you though.
                        Send us a message using the form below. Allow 48 hours for a response.
                    </Text>
                    <Radio.Group
                        name='prefContact'
                        label="Preffered Contact"
                        description="How would you like us to get back in touch with you?"
                        value={prefCont}
                        onChange={setPrefCont}
                    >
                        <Group mt={'md'}>
                            <Radio value='email' label='Email' />
                            <Radio value='phone' label='Phone' />
                            <Radio value='text' label='Text/SMS' />
                        </Group>
                    </Radio.Group>
                    <Textarea label='Message'
                        description="Please describe what you need"
                        minRows={3}
                        minLength={20}
                        value={msg}
                        placeholder='I was wondering if a feature was going to be available...'
                        onChange={setMsg} />
                    <Group justify='space-between' grow wrap='nowrap'>
                        <Button color='orange' onClick={() => {
                            params.onClose();
                            close()
                        }}>Cancel</Button>
                        <Button onClick={sendHandler}>Submit</Button>
                    </Group>

                </Card>
            </Modal>
        </>
    );
}