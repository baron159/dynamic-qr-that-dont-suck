import { Container, Text, Typography, Card } from "@mantine/core";


export default function Landing() {

    return (<Container mt={'2rem'}>
        <Card withBorder p={'3rem'}>
            <Text component="div" ta={'center'}>
                <Typography>
                    <h3>Dynamic QR Service that don't Suck</h3>
                    <p>
                        A Dynamic QR code allows you to change the underlying link behind the QR code, without changing the
                        actual QR code that is rendered. This means you can put the QR code on a poster, business card, flyer, etc.
                        and chnage where it points, without having to create new/print new materials.
                    </p>
                    <p>
                        <b>Is this new technology?</b> No, dynamic QR codes have been around for awhile. Our service is pretty feature
                        comparable to all the other providers out there. <b>However...</b> you will notice, our price point is better
                        than ALL other services out there. Where they charge $20 <b>PER MONTH</b>, we charge a one-time $20 per QR.
                        Which means in your first year, you can save $220. That saving only increases the longer you use our service.
                    </p>
                    <h4>But I need many codes...</h4>
                    <p>
                        We still have you covered. With a $10 per month subscription. You can create as many dynamic QR codes as you
                        need. You will also get access to any and all feature we can (and will) provide. Like our Dynamicily-Dynamic
                        QR, allows you to pass information into the link. This can be used for 'unique' scan instances, or links that
                        change with the date!
                    </p>
                </Typography>
            </Text>
        </Card>

    </Container>)
}