import { Container, Title, Card, TextInput, Button, PasswordInput, Group, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/auth.ctx";
import { useLocation } from "wouter";

export default function EntryPage() {
    const [, setLocation] = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [inCreateMode, setInCreateMode] = useState(false);
    const { signin, signup, isAuthenticated } = useAuth();

    // Redirect to dashboard if authenticated
    useEffect(() => { if (isAuthenticated) setLocation('/dashboard'); }, [ isAuthenticated ])
    
    const handleSubmit = async () => {
        setLoading(true);
        if (inCreateMode) {
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            await signup({ email, password, name, phone });
        } else {
            await signin({ email, password });
        }
    }

    return (<Container py="2rem">
        <Card w={{ base: '70%', md: '50%', lg: '40%' }} withBorder mx="auto">
            <Stack>
                <Title order={3} ta="center">Better QR - {inCreateMode ? 'Create Account' : 'Sign In'}</Title>
                <TextInput label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <PasswordInput label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                {inCreateMode && (
                    <>
                        <PasswordInput error={password !== confirmPassword && 'Passwords do not match'} label="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} />
                        <TextInput label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </>
                )}
                {error && <Text color="red" ta="center">{error}</Text>}
                <Group justify="space-between">
                    <Button onClick={handleSubmit} loading={loading}>{inCreateMode ? 'Create Account' : 'Sign In'}</Button>
                    <Button onClick={() => setInCreateMode(!inCreateMode)} variant={'subtle'}>{inCreateMode ? 'Have an account?' : 'Get an account'}</Button>
                </Group>
            </Stack>
        </Card>
    </Container>)
}