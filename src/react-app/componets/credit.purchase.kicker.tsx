import { Group, Button, Text, Stack } from "@mantine/core";
import { useAuth } from "../contexts/auth.ctx";
import { useState } from "react";
import NumInput from "./number.input";

export default function CreditPurchaseKicker() {
    const { injectHeader } = useAuth();
    const [num, setNum] = useState(1);
    const [loading, setLoading] = useState(false);

    const startPurchase = async () => {
        setLoading(true)
        const req = new Request(`/api/auth/credit/purchase?q=${num}`);
        injectHeader(req);
        const res = await fetch(req);
        if(res.status === 200){
            const b = await res.json() as {url: string};
            window.location.href = b.url;
        } else {
            setLoading(false);
        }
    }

    return (<Stack gap={8} ta={'center'}>
        <Text size="1.2rem">Purchase Credits</Text>
        <Group justify='space-around' wrap='nowrap' grow>
            <NumInput defaultVal={num} onChanged={setNum} />
            <Button loading={loading} onClick={startPurchase}>Buy</Button>
        </Group>
    </Stack>)
}