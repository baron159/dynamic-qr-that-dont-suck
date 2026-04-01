import type { Qr } from 'pc/browser';
import { Group, Text, Stack, Typography } from '@mantine/core';

export default function QrList({ qrs }: {qrs: Qr[]}) {
    return (<Stack>
        {qrs.map((qr) => (
            <Group key={qr.id} grow justify='space-between'>
                <Text component='div'>
                    <Typography>
                        <h5>qr.nickname</h5>
                        <p>qr.redirectLink</p>
                    </Typography>
                </Text>
                <div>
                    {qr.updatedAt.toLocaleDateString()}
                </div>
            </Group>
        ))}
    </Stack>)
}