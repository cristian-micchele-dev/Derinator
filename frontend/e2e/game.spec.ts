import { test, expect } from '@playwright/test'

test.describe('Derinator - Home', () => {
  test('loads the landing page', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('h1:has-text("Derinator")')).toBeVisible()
    await expect(page.locator('text=El genio que lee tu mente')).toBeVisible()
    await expect(page.getByRole('button', { name: /▶ Jugar/ })).toBeVisible()
  })

  test('navigate to game via Jugar button', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /▶ Jugar/ }).click()
    await page.waitForURL('/jugar')

    // Should show the start screen
    await expect(page.locator('text=¿En qué estás pensando?')).toBeVisible()
    await expect(page.locator('text=Comenzar')).toBeVisible()
  })
})

test.describe('Derinator - Start Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jugar')
  })

  test('shows character count for selected category', async ({ page }) => {
    // Default is personajes (Ficción)
    await expect(page.locator('text=personajes de ficción')).toBeVisible()

    // Switch to animales
    await page.click('text=Animales')
    await expect(page.locator('text=animales disponibles')).toBeVisible()

    // Switch to famosos
    await page.click('text=Famosos')
    await expect(page.locator('text=famosos reales')).toBeVisible()
  })

  test('category selection toggles active state', async ({ page }) => {
    // Ficción should be active by default
    const ficcionBtn = page.locator('button:has-text("Ficción")')
    await expect(ficcionBtn).toHaveClass(/active/)

    // Click Animales
    await page.click('text=Animales')
    await expect(page.locator('button:has-text("Animales")')).toHaveClass(/active/)
    await expect(ficcionBtn).not.toHaveClass(/active/)
  })

  test('start game shows first question', async ({ page }) => {
    await page.click('text=Comenzar')

    // Should show a question
    const questionBox = page.locator('.question-box p').first()
    await expect(questionBox).toBeVisible()

    // Should show answer buttons
    await expect(page.locator('.btn-yes')).toBeVisible()
    await expect(page.locator('.btn-no')).toBeVisible()

    // Should show progress info
    await expect(page.locator('text=Pregunta 1')).toBeVisible()
  })
})

test.describe('Derinator - Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jugar')
    await page.click('text=Comenzar')
    await page.waitForSelector('.question-box')
  })

  test('answering a question advances the game', async ({ page }) => {
    // Answer first question
    await page.click('.btn-yes')

    // Wait for thinking delay (1200ms)
    await page.waitForTimeout(1500)

    // Should now show question 2+
    const progressText = await page.locator('.progress-info').textContent()
    expect(progressText).toMatch(/Pregunta [2-9]/)
  })

  test('exit button returns to start screen', async ({ page }) => {
    await page.click('text=← Volver al inicio')

    // Should be back at start
    await expect(page.locator('text=¿En qué estás pensando?')).toBeVisible()
    await expect(page.locator('text=Comenzar')).toBeVisible()
  })

  test('answering multiple questions shows confidence bar', async ({ page }) => {
    // Answer several questions
    for (let i = 0; i < 5; i++) {
      await page.waitForSelector('.btn-yes')
      await page.click('.btn-yes')
      await page.waitForTimeout(1500)
    }

    // Confidence bar should be visible
    await expect(page.locator('.confidence-bar')).toBeVisible()
    await expect(page.locator('.confidence-label')).toBeVisible()
  })

  test('all five answer options are available', async ({ page }) => {
    await expect(page.locator('.btn-yes:has-text("Sí")')).toBeVisible()
    await expect(page.locator('.btn-no:has-text("No")')).toBeVisible()
    await expect(page.locator('.btn-probably:has-text("Probablemente")')).toBeVisible()
    await expect(page.locator('.btn-probably-not:has-text("Probablemente no")')).toBeVisible()
    await expect(page.locator('.btn-dont-know:has-text("No lo sé")')).toBeVisible()
  })
})
