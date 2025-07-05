import { Request, Response, NextFunction } from 'express';
export declare function isRateLimited(req: Request, res: Response, next: NextFunction): Promise<void>;
