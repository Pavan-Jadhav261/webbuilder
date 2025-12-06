import { Request, Response, NextFunction } from "express";
interface authReq extends Request {
    userId?: string;
}
export declare const auth: (req: authReq, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=middleware.d.ts.map