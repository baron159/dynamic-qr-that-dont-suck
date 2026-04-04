import { User, Qr } from 'pc/browser';
import { useAuth } from './auth.ctx';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useListState } from '@mantine/hooks';


export type UserFront = Omit<User, "passHash" | "createdAt">;
export type InfoRes = UserFront & { Qr: Qr[], _count:{ Credit: number }};
// Function param types
type UserUpdateParams = Partial<Pick<UserFront, 'name' | 'phone'>>;
type QrUpdateParams = Partial<Pick<Qr, 'nickname' | 'redirectLink' | 'active'>>
const INFO_EP = '/api/auth/info' as const;


export interface InfoContextType {
    user: UserFront | undefined
    qrList: Qr[]
    ownedCredits: number
    usedCredits: number
    isMonthlySuber: boolean
    // Helper functions
    updateUser: (up: UserUpdateParams) => Awaited<void>
    updateQr: (qi: string, qp: QrUpdateParams) => Awaited<void>
    createQr: (redirectLink: string, nickname?: string) => Awaited<void>
    infoReload: () => Awaited<void>
}

const InfoContext = createContext<InfoContextType | undefined>(undefined);

export const InfoProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const { isAuthenticated, injectHeader } = useAuth();

    const [user, setUser] = useState<UserFront | undefined>(undefined);
    const [ownedCredits, setOwnedCredits] = useState(0);
    const [usedCredits, setUsedCredits] = useState(0);
    const [isMonthlySuber, setMonthly] = useState(false);
    const [qrList, listHandlers] = useListState<Qr>([]);

    useEffect(()=>{
        if(isAuthenticated){
            infomationGrab();
        }
    }, [isAuthenticated]);

    const infomationGrab = async () => {
        const req = new Request(INFO_EP);
        injectHeader(req);
        const res = await fetch(req);
        const b = (await res.json() as {user: InfoRes}).user;
        console.log('results things', b)
        setUser({
            name: b.name,
            email: b.email,
            phone: b.phone,
            updatedAt: b.updatedAt,
            stripeCustomerId: b.stripeCustomerId,
            monthlySubscription: b.monthlySubscription,
            id: b.id
        });
        setOwnedCredits(b._count.Credit);
        setUsedCredits(b.Qr.length);
        setMonthly(!!b.monthlySubscription);
        listHandlers.setState(b.Qr);
    };

    const updateUser = async (up: UserUpdateParams) =>{};
    const updateQr = async (id: string, qp: QrUpdateParams) => {};
    const createQr = async (link: string, nickname?:string) => {};

    return (<InfoContext.Provider
        value={{ user, qrList, ownedCredits, usedCredits, isMonthlySuber, updateQr, updateUser, createQr, infoReload: infomationGrab}}
    >{children}</InfoContext.Provider>)
};

export const useInfo = (): InfoContextType => {
    const ctx = useContext(InfoContext);
    if(!ctx) throw new Error('useInfo must be ised within an InfoProvider');
    return ctx;
};

export { InfoContext };