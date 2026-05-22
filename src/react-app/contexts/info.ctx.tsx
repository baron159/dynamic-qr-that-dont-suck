import { User, Qr } from 'pc/browser';
import { useAuth } from './auth.ctx';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useListState } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { TryExtractingError } from '../util/response.error.extract';

export type UserFront = Omit<User, "passHash" | "createdAt">;
export type InfoRes = UserFront & { Qr: Qr[], _count:{ Credit: number }};
// Function param types
type UserUpdateParams = Partial<Pick<UserFront, 'name' | 'phone'>>;
export type QrUpdateParams = Partial<Pick<Qr, 'nickname' | 'redirectLink' | 'active' | 'options'>>;

const INFO_EP = '/api/auth/info' as const;
const QR_EP = '/api/auth/qr' as const;


export interface InfoContextType {
    user: UserFront | undefined
    qrList: Qr[]
    ownedCredits: number
    usedCredits: number
    isMonthlySuber: boolean
    isBusy: boolean
    billingPortal: string
    // Helper functions
    updateUser: (up: UserUpdateParams) => Promise<void>
    updateQr: (qi: string, qp: QrUpdateParams) => Promise<boolean>
    createQr: (redirectLink: string, nickname?: string) => Promise<Qr | null>
    infoReload: () => Promise<void>
    changeQrStatus: (id: string, status: boolean) => Promise<boolean>
}

const InfoContext = createContext<InfoContextType | undefined>(undefined);

export const InfoProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const { isAuthenticated, injectHeader } = useAuth();

    const [user, setUser] = useState<UserFront | undefined>(undefined);
    const [ownedCredits, setOwnedCredits] = useState(0);
    const [usedCredits, setUsedCredits] = useState(0);
    const [isMonthlySuber, setMonthly] = useState(false);
    const [qrList, listHandlers] = useListState<Qr>([]);
    const [isBusy, setBusy] = useState(false);
    const [ billingPortal, setBillingPortal ] = useState<string>('');

    useEffect(()=>{
        if(isAuthenticated){
            infomationGrab();
        }
    }, [isAuthenticated]);

    const infomationGrab = async () => {
        const req = new Request(INFO_EP);
        injectHeader(req);
        const res = await fetch(req);
        const infoResData = await res.json() as {user: InfoRes, billingPortal: string};
        setBillingPortal(infoResData.billingPortal);
        const b = infoResData.user;
        console.log('results things', b)
        setUser({
            name: b.name,
            email: b.email,
            phone: b.phone,
            updatedAt: b.updatedAt,
            stripeCustomerId: b.stripeCustomerId,
            monthlySubscription: b.monthlySubscription,
            subscriptionValidTill: b.subscriptionValidTill,
            id: b.id
        });
        setOwnedCredits(b._count.Credit);
        const activeQr = b.Qr.filter(q => q.active);
        setUsedCredits(activeQr.length);
        setMonthly(!!b.monthlySubscription);
        listHandlers.setState(b.Qr);
    };

    const updateUser = async (up: UserUpdateParams) =>{
        setBusy(true);
        const req = new Request(INFO_EP, {
            method: 'PUT',
            body: JSON.stringify({ ...up })
        });
        injectHeader(req);
        const res = await fetch(req);
        if(res.status === 200){
            // @ts-ignore --- I believe this is fine, for how it will be used
            setUser(prev => {
                return {...prev, ...up}
            });
            notifications.show({
                title: 'Success',
                message: 'User info has been updated!',
                withBorder: true
            });
        } else {
            const message = TryExtractingError(res);
            notifications.show({
                title: 'Uh-oh',
                message,
                withBorder: true,
                style: { backgroundColor: 'red' },
            });
        }
        setBusy(false);
    };

    const updateQr = async (id: string, qp: QrUpdateParams, showSuccessNotify = true): Promise<boolean> => {
        setBusy(true);
        const qr = qrList.filter(q => q.id === id);
        if(qr.length  === 0){
            notifications.show({
                title: 'Uh-oh QR update failed',
                message: 'There is no QR code found with the ID given',
                withBorder: true,
                color: 'red',
            })
            setBusy(false);
            return false;
        } else if (qr.length > 1){
            console.warn('[INFO-CTX::updateQR] multiple QR in context list with the same ID');
        }
        const req = new Request(QR_EP, {
            method: 'PUT',
            body: JSON.stringify({
                id, ...qp
            })
        });
        injectHeader(req);
        const res = await fetch(req);
        if(res.status !== 200){
            const message = TryExtractingError(res);
            notifications.show({
                title: 'Uh-oh QR update failed',
                message,
                withBorder: true,
                color: 'red',
            });
            setBusy(false);
            return false;
        }
        const resBdy = await res.json() as { qr: Qr, activeCount: number }
        listHandlers.applyWhere(
            (q) => q.id === id,
            (q) => ({...q, ...qp})
        );
        setUsedCredits(resBdy.activeCount);
        showSuccessNotify && notifications.show({
            title: 'QR updated!',
            message: 'Your QR setting have been saved!',
            withBorder: true,
        });
        setBusy(false);
        return true;
    };

    /**
     * Change a QR active status
     * @param id of the QR
     * @param status What status to set
     * @returns true -or- false based on if the Request returned with success
     */
    const changeQrStatus = async (id: string, status: boolean) => {
        const changing = qrList.filter(q => q.id === id)[0];
        if (!!changing && changing.active === status) {
            notifications.show({
                title: 'Ummm',
                message: 'QR is already in the requested status',
                withBorder: true,
                color: 'orange',
            });
            return true; // Technically true
        } else if(!changing){
            notifications.show({
                title: 'Ummm',
                message: 'QR can not be found',
                withBorder: true,
                color: 'red',
            });
            return false; // This is a bigger problem, but shouldn't happen
        }
        setBusy(true);
        // If the status is true, do some checks
        if(status){
            const activeCount = qrList.filter(q => q.active);
            if((activeCount.length +1 > ownedCredits) && !isMonthlySuber){
                notifications.show({
                    title: ':( QR activation Failed',
                    message: 'You already have the maxed codes active. Buy another credit, or deactivate another QR',
                    withBorder: true,
                    color: 'red',
                });
                setBusy(false);
                return false;
            }
        }
        const updateResult = await updateQr(id, {active: status}, false);
        updateResult && notifications.show({
            message: `QR has been: ${status ? 'Activated' : 'Deactivated'}`,
            withBorder: true,
        });
        return true;
    };

    /**
     * helper function to create a new QR code
     * @param link 
     * @param nickname 
     */
    const createQr = async (link: string, nickname?:string) => {
        setBusy(true);
        const req = new Request(QR_EP, {
            method: 'POST',
            body: JSON.stringify({nickname, redirectLink: link})
        });
        injectHeader(req);
        const res = await fetch(req);
        if(res.status !== 200){
            const message = TryExtractingError(res);
            console.error('[INFO-CTX::ERROR::createQr] Something went wrong\n', message);
            notifications.show({
                title: 'Failed to Create',
                message,
                withBorder: true,
                color: 'red'
            });
            setBusy(false);
            return null;
        } else {
            const qrBody = await res.json() as {qr: Qr, activeCount: number};
            listHandlers.append(qrBody.qr);
            setUsedCredits(qrBody.activeCount);
            setBusy(false);
            notifications.show({
                message:"New Dynamic QR code created!",
                withBorder: true,
            });

            return qrBody.qr;
        }
    };

    return (<InfoContext.Provider
        value={{ 
            user, qrList, ownedCredits, 
            usedCredits, isMonthlySuber, isBusy, 
            billingPortal,
            updateQr, updateUser, createQr, 
            infoReload: infomationGrab, 
            changeQrStatus
        }}
    >{children}</InfoContext.Provider>)
};

export const useInfo = (): InfoContextType => {
    const ctx = useContext(InfoContext);
    if(!ctx) throw new Error('useInfo must be ised within an InfoProvider');
    return ctx;
};

export { InfoContext };