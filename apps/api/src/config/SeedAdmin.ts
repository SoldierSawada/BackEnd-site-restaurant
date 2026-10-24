import { randomUUID } from 'node:crypto';
import { Container } from 'inversify';
import { BookingIdentifiers, Email, Member, MemberRepository, PasswordHasher } from 'restaurant-core';

const defaultAdminEmail = 'admin@restaurant.fr';
const defaultAdminPassword = 'Responsable2026';

// Crée le compte responsable (rôle ADMIN) au démarrage, à partir de ADMIN_EMAIL et ADMIN_PASSWORD
// (ou des valeurs par défaut). Le compte n'est créé qu'une fois : s'il existe déjà, rien ne change.
export async function seedAdmin(container: Container, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const memberRepository = container.get<MemberRepository>(BookingIdentifiers.memberRepository);
  const passwordHasher = container.get<PasswordHasher>(BookingIdentifiers.passwordHasher);

  const email = Email.create(env.ADMIN_EMAIL ?? defaultAdminEmail);

  if (await memberRepository.findByEmail(email)) {
    return;
  }

  const passwordHash = await passwordHasher.hash(env.ADMIN_PASSWORD ?? defaultAdminPassword);

  const admin = Member.reconstitute({
    id: randomUUID(),
    name: 'Responsable',
    email,
    passwordHash,
    status: 'ACTIVE',
    role: 'ADMIN',
  });

  await memberRepository.save(admin);
}
