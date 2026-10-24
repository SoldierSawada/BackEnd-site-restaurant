import { ExpressMiddlewareInterface } from 'routing-controllers';
import { inject, injectable } from 'inversify';
import { NextFunction, Response } from 'express';
import { BookingIdentifiers, MemberRepository, SessionRepository } from 'restaurant-core';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

// Authentification par session : en-tête "Authorization: Bearer <token>", où le token
// est celui renvoyé par POST /restaurant/login.
@injectable()
export class AuthenticationMiddleware implements ExpressMiddlewareInterface {
  constructor(
    @inject(BookingIdentifiers.memberRepository)
    private readonly memberRepository: MemberRepository,

    @inject(BookingIdentifiers.sessionRepository)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async use(request: AuthenticatedRequest, response: Response, next: NextFunction) {
    try {
      const authorization = request.header('Authorization');
      if (!authorization) {
        response.status(401).json({ error: 'UnauthorizedError', message: 'En-tête Authorization manquant' });
        return;
      }

      const [scheme, bearerToken] = authorization.split(' ');
      const session =
        scheme === 'Bearer' && bearerToken ? await this.sessionRepository.findByToken(bearerToken) : null;
      const member = session ? await this.memberRepository.findById(session.memberId) : null;

      if (!session || !member) {
        response.status(401).json({ error: 'UnauthorizedError', message: 'Session invalide ou expirée' });
        return;
      }

      request.identity = {
        memberId: member.id,
        name: member.getName(),
        role: member.getRole(),
        token: session.token,
      };
      next();
    } catch (error) {
      next(error);
    }
  }
}
