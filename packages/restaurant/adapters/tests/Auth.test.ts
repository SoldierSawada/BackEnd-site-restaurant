import 'reflect-metadata';

import { assert, expect, test } from 'vitest';
import { Container } from 'inversify';

import {
  BookingIdentifiers,
  InvalidCredentialsError,
  LoginMember,
  LogoutMember,
  MemberRepository,
  PasswordHasher,
  RegisterMember,
  SessionRepository,
  WeakPasswordError,
} from 'restaurant-core';
import { Build } from 'restaurant-adapters';

function createTestContainer(): Container {
  const container = new Container();
  Build.load(container);
  return container;
}

async function registerAlice(container: Container): Promise<string> {
  return container
    .get(RegisterMember)
    .execute({ name: 'Alice', email: 'alice@restaurant.fr', password: 'motdepasse1' });
}

test('PasswordHasher - le hachage ne contient pas le mot de passe et se vérifie', async () => {
  const hasher = createTestContainer().get<PasswordHasher>(BookingIdentifiers.passwordHasher);

  const hash = await hasher.hash('motdepasse1');

  assert.notInclude(hash, 'motdepasse1');
  assert.equal(await hasher.verify('motdepasse1', hash), true);
  assert.equal(await hasher.verify('mauvais-mot', hash), false);
  assert.equal(await hasher.verify('motdepasse1', 'format-invalide'), false);
});

test('PasswordHasher - deux hachages du même mot de passe sont différents (sel aléatoire)', async () => {
  const hasher = createTestContainer().get<PasswordHasher>(BookingIdentifiers.passwordHasher);

  const first = await hasher.hash('motdepasse1');
  const second = await hasher.hash('motdepasse1');

  assert.notEqual(first, second);
});

test('RegisterMember - le mot de passe est enregistré haché, jamais en clair', async () => {
  const container = createTestContainer();
  const id = await registerAlice(container);

  const member = await container.get<MemberRepository>(BookingIdentifiers.memberRepository).findById(id);

  assert.ok(member);
  assert.notEqual(member.getPasswordHash(), 'motdepasse1');
  assert.notInclude(member.getPasswordHash(), 'motdepasse1');
});

test('RegisterMember - erreur si le mot de passe fait moins de 8 caractères', async () => {
  const container = createTestContainer();

  await expect(
    container.get(RegisterMember).execute({ name: 'Alice', email: 'alice@restaurant.fr', password: 'court' }),
  ).rejects.toThrowError(WeakPasswordError);
});

test('LoginMember - renvoie un jeton et l’identifiant du membre si les identifiants sont bons', async () => {
  const container = createTestContainer();
  const id = await registerAlice(container);

  const result = await container
    .get(LoginMember)
    .execute({ email: 'ALICE@restaurant.fr', password: 'motdepasse1' });

  assert.equal(result.memberId, id);
  assert.equal(result.token.length, 64);
  assert.notEqual(result.token, id);

  const session = await container.get<SessionRepository>(BookingIdentifiers.sessionRepository).findByToken(result.token);
  assert.ok(session);
  assert.equal(session.memberId, id);
});

test('LoginMember - mauvais mot de passe : erreur générique', async () => {
  const container = createTestContainer();
  await registerAlice(container);

  await expect(
    container.get(LoginMember).execute({ email: 'alice@restaurant.fr', password: 'mauvais-mot' }),
  ).rejects.toThrowError(InvalidCredentialsError);
});

test('LoginMember - email inconnu : même erreur générique que le mauvais mot de passe', async () => {
  const container = createTestContainer();

  await expect(
    container.get(LoginMember).execute({ email: 'inconnu@restaurant.fr', password: 'motdepasse1' }),
  ).rejects.toThrowError(InvalidCredentialsError);
});

test('LogoutMember - le jeton n’est plus valide après déconnexion', async () => {
  const container = createTestContainer();
  await registerAlice(container);
  const { token } = await container
    .get(LoginMember)
    .execute({ email: 'alice@restaurant.fr', password: 'motdepasse1' });

  await container.get(LogoutMember).execute({ token });

  const session = await container.get<SessionRepository>(BookingIdentifiers.sessionRepository).findByToken(token);
  assert.isNull(session);
});

test('LoginMember - chaque connexion crée un jeton différent', async () => {
  const container = createTestContainer();
  await registerAlice(container);
  const login = container.get(LoginMember);

  const first = await login.execute({ email: 'alice@restaurant.fr', password: 'motdepasse1' });
  const second = await login.execute({ email: 'alice@restaurant.fr', password: 'motdepasse1' });

  assert.notEqual(first.token, second.token);
});
