import 'reflect-metadata';

import { assert, expect, test } from 'vitest';
import { Container } from 'inversify';

import {
  ChangeMemberPassword,
  CurrentPasswordIncorrectError,
  GetMember,
  InvalidCredentialsError,
  InvalidMemberNameError,
  LoginMember,
  MemberNotFoundError,
  RegisterMember,
  UpdateMemberName,
  WeakPasswordError,
} from 'restaurant-core';
import { Build } from 'restaurant-adapters';

function createTestContainer(): Container {
  const container = new Container();
  Build.load(container);
  return container;
}

async function registerAna(container: Container): Promise<string> {
  return container.get(RegisterMember).execute({
    name: 'Ana',
    email: 'settings@b.fr',
    password: 'ancien-mdp-1',
  });
}

test('UpdateMemberName - renomme le membre et enlève les espaces autour du nom', async () => {
  const container = createTestContainer();
  const memberId = await registerAna(container);

  const result = await container.get(UpdateMemberName).execute({
    memberId,
    name: '  Ana Martin  ',
  });
  const member = await container.get(GetMember).execute({ memberId });

  assert.equal(result.name, 'Ana Martin');
  assert.equal(member.getName(), 'Ana Martin');
});

test('UpdateMemberName - refuse un nom vide', async () => {
  const container = createTestContainer();
  const memberId = await registerAna(container);

  await expect(
    container.get(UpdateMemberName).execute({ memberId, name: '   ' }),
  ).rejects.toThrow(InvalidMemberNameError);
});

test('UpdateMemberName - refuse un membre inconnu', async () => {
  const container = createTestContainer();

  await expect(
    container.get(UpdateMemberName).execute({ memberId: 'inconnu', name: 'Ana' }),
  ).rejects.toThrow(MemberNotFoundError);
});

test('ChangeMemberPassword - le nouveau mot de passe remplace l\'ancien', async () => {
  const container = createTestContainer();
  await registerAna(container);
  const memberId = (await container.get(LoginMember).execute({
    email: 'settings@b.fr',
    password: 'ancien-mdp-1',
  })).memberId;

  await container.get(ChangeMemberPassword).execute({
    memberId,
    currentPassword: 'ancien-mdp-1',
    newPassword: 'nouveau-mdp-2',
  });

  const session = await container.get(LoginMember).execute({
    email: 'settings@b.fr',
    password: 'nouveau-mdp-2',
  });
  assert.equal(session.memberId, memberId);
  await expect(
    container.get(LoginMember).execute({ email: 'settings@b.fr', password: 'ancien-mdp-1' }),
  ).rejects.toThrow(InvalidCredentialsError);
});

test('ChangeMemberPassword - refuse si le mot de passe actuel est faux, sans rien changer', async () => {
  const container = createTestContainer();
  const memberId = await registerAna(container);

  await expect(
    container.get(ChangeMemberPassword).execute({
      memberId,
      currentPassword: 'mauvais-mdp',
      newPassword: 'nouveau-mdp-2',
    }),
  ).rejects.toThrow(CurrentPasswordIncorrectError);

  const session = await container.get(LoginMember).execute({
    email: 'settings@b.fr',
    password: 'ancien-mdp-1',
  });
  assert.equal(session.memberId, memberId);
});

test('ChangeMemberPassword - refuse un nouveau mot de passe trop court', async () => {
  const container = createTestContainer();
  const memberId = await registerAna(container);

  await expect(
    container.get(ChangeMemberPassword).execute({
      memberId,
      currentPassword: 'ancien-mdp-1',
      newPassword: 'court',
    }),
  ).rejects.toThrow(WeakPasswordError);
});

test('ChangeMemberPassword - refuse un membre inconnu', async () => {
  const container = createTestContainer();

  await expect(
    container.get(ChangeMemberPassword).execute({
      memberId: 'inconnu',
      currentPassword: 'x',
      newPassword: 'nouveau-mdp-2',
    }),
  ).rejects.toThrow(MemberNotFoundError);
});
