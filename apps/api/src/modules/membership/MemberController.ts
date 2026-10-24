import {
  Body,
  ForbiddenError,
  Get,
  JsonController,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseBefore,
} from 'routing-controllers';
import { inject, injectable } from 'inversify';
import {
  ChangeMemberPassword,
  GetMember,
  GetMemberReservations,
  LoginMember,
  LogoutMember,
  RecordActivity,
  RegisterMember,
  UpdateMemberName,
} from 'restaurant-core';

import {
  ChangePasswordCommand,
  LoginCommand,
  RegisterMemberCommand,
  UpdateProfileCommand,
} from './command/MemberCommand';
import { AuthenticationMiddleware } from '../../middlewares/AuthenticationMiddleware';
import { AuthenticatedRequest } from '../../types/AuthenticatedRequest';
import { toReservationResponse } from '../restaurant/ReservationResponse';

@injectable()
@JsonController()
export class MemberController {
  constructor(
    @inject(RegisterMember)
    private readonly registerMember: RegisterMember,

    @inject(GetMemberReservations)
    private readonly getMemberReservations: GetMemberReservations,

    @inject(GetMember)
    private readonly getMember: GetMember,

    @inject(RecordActivity)
    private readonly recordActivity: RecordActivity,

    @inject(LoginMember)
    private readonly loginMember: LoginMember,

    @inject(LogoutMember)
    private readonly logoutMember: LogoutMember,

    @inject(UpdateMemberName)
    private readonly updateMemberName: UpdateMemberName,

    @inject(ChangeMemberPassword)
    private readonly changeMemberPassword: ChangeMemberPassword,
  ) {}

  @Get('/members/:id')
  @UseBefore(AuthenticationMiddleware)
  async member(@Param('id') memberId: string, @Req() request: AuthenticatedRequest) {
    if (request.identity.memberId !== memberId) {
      throw new ForbiddenError('Accès réservé au membre concerné');
    }

    const member = await this.getMember.execute({ memberId });

    return {
      id: member.id,
      name: member.getName(),
      email: member.getEmail(),
      role: member.getRole(),
    };
  }

  @Patch('/members/:id')
  @UseBefore(AuthenticationMiddleware)
  async updateProfile(
    @Param('id') memberId: string,
    @Body() command: UpdateProfileCommand,
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.identity.memberId !== memberId) {
      throw new ForbiddenError('Accès réservé au membre concerné');
    }

    return this.updateMemberName.execute({ memberId, name: command.name });
  }

  @Put('/members/:id/password')
  @UseBefore(AuthenticationMiddleware)
  async changePassword(
    @Param('id') memberId: string,
    @Body() command: ChangePasswordCommand,
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.identity.memberId !== memberId) {
      throw new ForbiddenError('Accès réservé au membre concerné');
    }

    await this.changeMemberPassword.execute({
      memberId,
      currentPassword: command.currentPassword,
      newPassword: command.newPassword,
    });

    return { changed: true };
  }

  @Post('/members')
  async register(@Body() command: RegisterMemberCommand) {
    const memberId = await this.registerMember.execute({
      name: command.name,
      email: command.email,
      password: command.password,
    });

    await this.recordActivity.execute({
      action: 'MEMBER_REGISTERED',
      memberId,
      details: 'Nouveau membre inscrit',
    });

    return { id: memberId };
  }

  @Post('/login')
  async login(@Body() command: LoginCommand) {
    return this.loginMember.execute({ email: command.email, password: command.password });
  }

  @Post('/logout')
  @UseBefore(AuthenticationMiddleware)
  async logout(@Req() request: AuthenticatedRequest) {
    await this.logoutMember.execute({ token: request.identity.token });

    return { loggedOut: true };
  }

  @Get('/members/:id/reservations')
  @UseBefore(AuthenticationMiddleware)
  async reservations(@Param('id') memberId: string, @Req() request: AuthenticatedRequest) {
    // Un membre ne consulte que ses propres réservations.
    if (request.identity.memberId !== memberId) {
      throw new ForbiddenError('Accès réservé au membre concerné');
    }

    const reservations = await this.getMemberReservations.execute({ memberId });

    return reservations.map(toReservationResponse);
  }
}
