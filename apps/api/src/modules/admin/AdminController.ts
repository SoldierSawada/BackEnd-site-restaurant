import {
  Body,
  Delete,
  ForbiddenError,
  Get,
  JsonController,
  Param,
  Patch,
  Post,
  Put,
  QueryParams,
  Req,
  UseBefore,
} from 'routing-controllers';
import { inject, injectable } from 'inversify';
import {
  CreateBlogArticle,
  CreateMenuItem,
  CreateTable,
  DeleteBlogArticle,
  DeleteMenuItem,
  DeleteReview,
  GetAdminDashboard,
  DeleteReviewReply,
  GetReservationStats,
  ListActivityLogs,
  ListTablesPage,
  RecordActivity,
  ReplyToReview,
  SetTableActive,
} from 'restaurant-core';

import { CreateTableCommand, PageQuery, SetTableActiveCommand } from './command/AdminCommand';
import { ReplyReviewCommand } from '../review/command/ReviewCommand';
import { BlogArticleCommand } from '../blog/command/BlogCommand';
import { MenuItemCommand } from '../menu/command/MenuCommand';
import { toBlogArticleResponse } from '../blog/BlogController';
import { toMenuItemResponse } from '../menu/MenuController';
import { AuthenticationMiddleware } from '../../middlewares/AuthenticationMiddleware';
import { AuthenticatedRequest } from '../../types/AuthenticatedRequest';
import { NotificationHub } from '../notification/NotificationHub';

// Routes réservées au responsable d'établissement (rôle ADMIN).
@injectable()
@JsonController('/admin')
export class AdminController {
  constructor(
    @inject(CreateTable)
    private readonly createTable: CreateTable,

    @inject(SetTableActive)
    private readonly setTableActive: SetTableActive,

    @inject(GetReservationStats)
    private readonly getReservationStats: GetReservationStats,

    @inject(RecordActivity)
    private readonly recordActivity: RecordActivity,

    @inject(ListActivityLogs)
    private readonly listActivityLogs: ListActivityLogs,

    @inject(NotificationHub)
    private readonly notificationHub: NotificationHub,

    @inject(ListTablesPage)
    private readonly listTablesPage: ListTablesPage,

    @inject(DeleteReview)
    private readonly deleteReview: DeleteReview,

    @inject(GetAdminDashboard)
    private readonly getAdminDashboard: GetAdminDashboard,

    @inject(ReplyToReview)
    private readonly replyToReview: ReplyToReview,

    @inject(DeleteReviewReply)
    private readonly deleteReviewReply: DeleteReviewReply,

    @inject(CreateBlogArticle)
    private readonly createBlogArticle: CreateBlogArticle,

    @inject(DeleteBlogArticle)
    private readonly deleteBlogArticle: DeleteBlogArticle,

    @inject(CreateMenuItem)
    private readonly createMenuItem: CreateMenuItem,

    @inject(DeleteMenuItem)
    private readonly deleteMenuItem: DeleteMenuItem,
  ) {}

  @Post('/tables')
  @UseBefore(AuthenticationMiddleware)
  async addTable(@Body() command: CreateTableCommand, @Req() request: AuthenticatedRequest) {
    this.ensureAdmin(request);

    const tableId = await this.createTable.execute({
      number: command.number,
      capacity: command.capacity,
      location: command.location,
    });

    await this.recordActivity.execute({
      action: 'TABLE_CREATED',
      memberId: request.identity.memberId,
      details: `Table ${command.number} ajoutée`,
    });

    return { id: tableId };
  }

  @Patch('/tables/:id')
  @UseBefore(AuthenticationMiddleware)
  async setActive(
    @Param('id') tableId: string,
    @Body() command: SetTableActiveCommand,
    @Req() request: AuthenticatedRequest,
  ) {
    this.ensureAdmin(request);

    const table = await this.setTableActive.execute({ tableId, active: command.active });

    await this.recordActivity.execute({
      action: command.active ? 'TABLE_ACTIVATED' : 'TABLE_DEACTIVATED',
      memberId: request.identity.memberId,
      details: `Table ${table.number}`,
    });

    this.notificationHub.broadcast({
      type: command.active ? 'TABLE_OUVERTE' : 'TABLE_FERMEE',
      title: command.active ? 'Table ouverte' : 'Table fermée',
      message: command.active
        ? `La table ${table.number} est ouverte aux réservations.`
        : `La table ${table.number} est fermée aux réservations.`,
      createdAt: new Date().toISOString(),
    });

    return {
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      location: table.location,
      active: table.getIsActive(),
    };
  }

  @Get('/reservation-stats')
  @UseBefore(AuthenticationMiddleware)
  async reservationStats(@Req() request: AuthenticatedRequest) {
    this.ensureAdmin(request);

    return this.getReservationStats.execute({ days: 14 });
  }

  @Get('/tables')
  @UseBefore(AuthenticationMiddleware)
  async tables(@Req() request: AuthenticatedRequest, @QueryParams() query: PageQuery) {
    this.ensureAdmin(request);

    const result = await this.listTablesPage.execute({ page: query.page, pageSize: query.pageSize });

    return {
      items: result.items.map((table) => ({
        id: table.id,
        number: table.number,
        capacity: table.capacity,
        location: table.location,
        active: table.getIsActive(),
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  @Get('/dashboard')
  @UseBefore(AuthenticationMiddleware)
  async dashboard(@Req() request: AuthenticatedRequest) {
    this.ensureAdmin(request);

    return this.getAdminDashboard.execute();
  }

  @Get('/logs')
  @UseBefore(AuthenticationMiddleware)
  async logs(@Req() request: AuthenticatedRequest, @QueryParams() query: PageQuery) {
    this.ensureAdmin(request);

    const result = await this.listActivityLogs.execute({ page: query.page, pageSize: query.pageSize });

    return {
      items: result.items.map((log) => ({
        id: log.id,
        action: log.props.action,
        memberId: log.props.memberId,
        details: log.props.details,
        createdAt: log.props.createdAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  @Delete('/reviews/:id')
  @UseBefore(AuthenticationMiddleware)
  async removeReview(@Param('id') reviewId: string, @Req() request: AuthenticatedRequest) {
    this.ensureAdmin(request);

    await this.deleteReview.execute({ reviewId });

    await this.recordActivity.execute({
      action: 'REVIEW_DELETED',
      memberId: request.identity.memberId,
      details: reviewId,
    });

    return { deleted: true };
  }

  @Put('/reviews/:id/reply')
  @UseBefore(AuthenticationMiddleware)
  async replyReview(
    @Param('id') reviewId: string,
    @Body() command: ReplyReviewCommand,
    @Req() request: AuthenticatedRequest,
  ) {
    this.ensureAdmin(request);

    await this.replyToReview.execute({ reviewId, text: command.text });

    await this.recordActivity.execute({
      action: 'REVIEW_REPLIED',
      memberId: request.identity.memberId,
      details: reviewId,
    });

    return { replied: true };
  }

  @Delete('/reviews/:id/reply')
  @UseBefore(AuthenticationMiddleware)
  async removeReviewReply(@Param('id') reviewId: string, @Req() request: AuthenticatedRequest) {
    this.ensureAdmin(request);

    await this.deleteReviewReply.execute({ reviewId });

    await this.recordActivity.execute({
      action: 'REVIEW_REPLY_DELETED',
      memberId: request.identity.memberId,
      details: reviewId,
    });

    return { deleted: true };
  }

  @Post('/blog/articles')
  @UseBefore(AuthenticationMiddleware)
  async addBlogArticle(@Body() command: BlogArticleCommand, @Req() request: AuthenticatedRequest) {
    this.ensureAdmin(request);

    const article = await this.createBlogArticle.execute({
      title: command.title,
      category: command.category,
      excerpt: command.excerpt,
      author: command.author,
      content: command.content,
    });

    await this.recordActivity.execute({
      action: 'BLOG_ARTICLE_CREATED',
      memberId: request.identity.memberId,
      details: article.id,
    });

    return toBlogArticleResponse(article);
  }

  @Delete('/blog/articles/:id')
  @UseBefore(AuthenticationMiddleware)
  async removeBlogArticle(@Param('id') articleId: string, @Req() request: AuthenticatedRequest) {
    this.ensureAdmin(request);

    await this.deleteBlogArticle.execute({ articleId });

    await this.recordActivity.execute({
      action: 'BLOG_ARTICLE_DELETED',
      memberId: request.identity.memberId,
      details: articleId,
    });

    return { deleted: true };
  }

  @Post('/menu/items')
  @UseBefore(AuthenticationMiddleware)
  async addMenuItem(@Body() command: MenuItemCommand, @Req() request: AuthenticatedRequest) {
    this.ensureAdmin(request);

    const item = await this.createMenuItem.execute({
      title: command.title,
      category: command.category,
      price: command.price,
      description: command.description,
    });

    await this.recordActivity.execute({
      action: 'MENU_ITEM_CREATED',
      memberId: request.identity.memberId,
      details: item.id,
    });

    return toMenuItemResponse(item);
  }

  @Delete('/menu/items/:id')
  @UseBefore(AuthenticationMiddleware)
  async removeMenuItem(@Param('id') itemId: string, @Req() request: AuthenticatedRequest) {
    this.ensureAdmin(request);

    await this.deleteMenuItem.execute({ itemId });

    await this.recordActivity.execute({
      action: 'MENU_ITEM_DELETED',
      memberId: request.identity.memberId,
      details: itemId,
    });

    return { deleted: true };
  }

  private ensureAdmin(request: AuthenticatedRequest): void {
    if (request.identity.role !== 'ADMIN') {
      throw new ForbiddenError('Accès réservé au responsable');
    }
  }
}
