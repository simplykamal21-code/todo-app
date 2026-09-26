import request from 'supertest'
import app from './server.js'

describe('Todo API', () => {
  let token1, token2

  beforeAll(async () => {
    const res1 = await request(app).post('/api/auth/login').send({ username: 'demo1', password: 'password123' })
    token1 = res1.body.token
    const res2 = await request(app).post('/api/auth/login').send({ username: 'demo2', password: 'password123' })
    token2 = res2.body.token
  })

  test('successful todo create and list', async () => {
    const create = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token1}`)
      .send({ title: 'Test todo from demo1' })
    expect(create.status).toBe(201)
    expect(create.body.title).toBe('Test todo from demo1')
    expect(create.body.completed).toBe(false)

    const list = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token1}`)
    expect(list.status).toBe(200)
    expect(list.body.some(t => t.title === 'Test todo from demo1')).toBe(true)
  })

  test('user cannot access or modify another users todo', async () => {
    // Create as demo1
    const create = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token1}`)
      .send({ title: 'Private todo' })
    const todoId = create.body.id

    // demo2 tries to get list - should not see it
    const list2 = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token2}`)
    expect(list2.body.every(t => t.id !== todoId)).toBe(true)

    // demo2 tries to patch
    const patch = await request(app)
      .patch(`/api/todos/${todoId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ completed: true })
    expect(patch.status).toBe(403)

    // demo2 tries to delete
    const del = await request(app)
      .delete(`/api/todos/${todoId}`)
      .set('Authorization', `Bearer ${token2}`)
    expect(del.status).toBe(403)
  })
})
