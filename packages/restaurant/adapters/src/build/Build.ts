import { Container } from 'inversify';
import { DataSource } from 'typeorm';
import { EventDispatcher } from 'ddd';

import { MemberBuild } from './MemberBuild';
import { ReservationBuild } from './ReservationBuild';
import { TableBuild } from './TableBuild';
import { JournalBuild } from './JournalBuild';
import { ContentBuild } from './ContentBuild';
import { DatabaseIdentifiers } from '../repositories/postgres/DatabaseIdentifiers';

import { InMemoryEventDispatcher, InMemoryMessageQueue } from 'messages-core';
import {
  CancelReservation,
  CreateReservation,
  CreateTable,
  GetAdminDashboard,
  GetMember,
  GetReservationStats,
  GetMemberReservations,
  ListActivityLogs,
  ListAvailableTables,
  ListTables,
  DeleteReview,
  DeleteReviewReply,
  GetMyReview,
  ListReviews,
  ListTablesPage,
  ChangeMemberPassword,
  LoginMember,
  UpdateMemberName,
  ReplyToReview,
  SubmitReview,
  LogoutMember,
  RecordActivity,
  RegisterMember,
  SetTableActive,
  CreateBlogArticle,
  CreateMenuItem,
  DeleteBlogArticle,
  DeleteMenuItem,
  GetBlogArticle,
  ListBlogArticles,
  ListMenuItems,
} from 'restaurant-core';

export interface BuildOptions {
  // Fournie et initialisée → repositories PostgreSQL (TypeORM). Absente → repositories en mémoire.
  dataSource?: DataSource;
}

export class Build {
  static load(container: Container, options: BuildOptions = {}): void {
    const { dataSource } = options;

    if (dataSource) {
      container.bind(DatabaseIdentifiers.dataSource).toConstantValue(dataSource);
    }

    MemberBuild.register(container, dataSource);
    ReservationBuild.register(container, dataSource);
    TableBuild.register(container, dataSource);
    JournalBuild.register(container, dataSource);
    ContentBuild.register(container, dataSource);

    container.bind(InMemoryMessageQueue).toSelf().inSingletonScope();
    container
      .bind(EventDispatcher)
      .toDynamicValue((context) => new InMemoryEventDispatcher(context.container.get(InMemoryMessageQueue)))
      .inSingletonScope();

    container.bind(RegisterMember).toSelf();
    container.bind(LoginMember).toSelf();
    container.bind(LogoutMember).toSelf();
    container.bind(UpdateMemberName).toSelf();
    container.bind(ChangeMemberPassword).toSelf();
    container.bind(GetMemberReservations).toSelf();
    container.bind(CancelReservation).toSelf();
    container.bind(CreateReservation).toSelf();
    container.bind(ListAvailableTables).toSelf();
    container.bind(ListTables).toSelf();
    container.bind(GetMember).toSelf();
    container.bind(GetAdminDashboard).toSelf();
    container.bind(CreateTable).toSelf();
    container.bind(SetTableActive).toSelf();
    container.bind(GetReservationStats).toSelf();
    container.bind(RecordActivity).toSelf();
    container.bind(ListActivityLogs).toSelf();
    container.bind(ListTablesPage).toSelf();
    container.bind(SubmitReview).toSelf();
    container.bind(GetMyReview).toSelf();
    container.bind(ListReviews).toSelf();
    container.bind(DeleteReview).toSelf();
    container.bind(ReplyToReview).toSelf();
    container.bind(DeleteReviewReply).toSelf();
    container.bind(ListBlogArticles).toSelf();
    container.bind(GetBlogArticle).toSelf();
    container.bind(CreateBlogArticle).toSelf();
    container.bind(DeleteBlogArticle).toSelf();
    container.bind(ListMenuItems).toSelf();
    container.bind(CreateMenuItem).toSelf();
    container.bind(DeleteMenuItem).toSelf();
  }
}
