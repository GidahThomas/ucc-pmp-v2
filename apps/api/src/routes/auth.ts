import { Router } from 'express';

import { prisma } from '@ucc/db';
import { changePasswordSchema, loginSchema } from '@ucc/shared';

import { authRequired, validateBody } from '../middleware';
import { hashPassword, signAccessToken, verifyPassword } from '../lib/auth';
import { AppError } from '../lib/errors';

const router = Router();

router.post('/login', validateBody(loginSchema), async (request, response, next) => {
  try {
    const input = request.body;
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { fullName: { equals: input.username, mode: 'insensitive' } },
          { email: { equals: input.username, mode: 'insensitive' } },
        ],
      },
    });

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new AppError(401, 'Incorrect username or password');
    }

    if (user.status !== 'active') {
      throw new AppError(403, 'This account is not active');
    }

    const token = signAccessToken(
      { userId: user.id, role: user.role, privileges: user.privileges },
      input.rememberMe,
    );

    response.json({
      token,
      user: {
        id: user.id,
        uuid: user.uuid,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        privileges: user.privileges,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authRequired, async (request, response, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: request.auth!.userId } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    response.json({
      id: user.id,
      uuid: user.uuid,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      privileges: user.privileges,
      phone: user.phone,
      nationality: user.nationality,
      occupation: user.occupation,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', authRequired, validateBody(changePasswordSchema), async (request, response, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: request.auth!.userId } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const passwordMatches = await verifyPassword(request.body.currentPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError(400, 'Current password is incorrect');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(request.body.newPassword),
      },
    });

    response.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
