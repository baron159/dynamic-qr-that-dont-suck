import { Group, Button, Text, Stack, Popover } from "@mantine/core";
import { useAuth } from "../contexts/auth.ctx";
import { useState } from "react";
import NumInput from "./number.input";
import { InfoIcon } from "@phosphor-icons/react";

export default function CreditPurchaseKicker() {
    const { injectHeader } = useAuth();
    const [num, setNum] = useState(1);
    const [loading, setLoading] = useState(false);

    const startPurchase = async () => {
        setLoading(true)
        const req = new Request(`/api/auth/credit/purchase?q=${num}`);
        injectHeader(req);
        const res = await fetch(req);
        if (res.status === 200) {
            const b = await res.json() as { url: string };
            window.location.href = b.url;
        } else {
            setLoading(false);
        }
    }

    return (<Stack gap={8} ta={'center'}>
        <Text size="1.2rem">Purchase Credits</Text>
        <Group wrap='nowrap'>
            <NumInput defaultVal={num} onChanged={setNum} />
            <Button loading={loading} onClick={startPurchase} w={'25%'}>Buy</Button>
            <Popover withArrow width={350}>
                <Popover.Target><InfoIcon size={48} weight="duotone" /></Popover.Target>
                <Popover.Dropdown>
                    <Text>
                        Credits are good for a lifetime of dynamic QR routes. These are really good
                        for business cards or t-shirts that you need to simply redirect to a web location.
                        <br /><br />
                        If you need more robust options. Like filehosting or passing data in when we redirect, then you
                        will need to subscribe, Its also recommend that you subscribe if you are going to need 10+ code right away.
                        (this will be a much cheaper way of exploring our features without breaking the bank)
                        <br /><br />
                        Subscriptions can be picked up at the account tab
                    </Text>
                </Popover.Dropdown>
            </Popover>
        </Group>
    </Stack>)
}