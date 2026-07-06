import { test, expect } from '@playwright/test'

// ===================================================================
// Daily Character (/del-dia)
// ===================================================================
test.describe('Daily Character', () => {
  test('loads the page with header and countdown', async ({ page }) => {
    await page.goto('/del-dia')

    await expect(page.locator('h1:has-text("Personaje del Día")')).toBeVisible()
    await expect(page.locator('text=Próximo personaje en:')).toBeVisible()

    // Countdown should be visible and formatted as HH:MM:SS
    const timer = page.locator('.daily-timer-value')
    await expect(timer).toBeVisible()
    const timerText = await timer.textContent()
    expect(timerText).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })

  test('shows pending state for today', async ({ page }) => {
    await page.goto('/del-dia')

    // Should show either pending or completed
    const pending = page.locator('text=Pendiente')
    const completed = page.locator('text=Completado')
    const isPending = await pending.isVisible().catch(() => false)
    const isCompleted = await completed.isVisible().catch(() => false)
    expect(isPending || isCompleted).toBe(true)
  })

  test('play button navigates to game', async ({ page }) => {
    await page.goto('/del-dia')

    const playBtn = page.locator('.daily-actions .btn-primary')
    await expect(playBtn).toBeVisible()
    await playBtn.click()
    await page.waitForURL('/jugar')

    await expect(page.locator('text=¿En qué estás pensando?')).toBeVisible()
  })

  test('back button navigates to home', async ({ page }) => {
    await page.goto('/del-dia')

    await page.click('text=← Volver')
    await page.waitForURL('/')

    await expect(page.locator('h1:has-text("Derinator")')).toBeVisible()
  })

  test('instructions section is visible', async ({ page }) => {
    await page.goto('/del-dia')

    await expect(page.locator('text=¿Cómo funciona?')).toBeVisible()
    await expect(page.locator('text=Todos los días hay un personaje secreto')).toBeVisible()
  })
})

// ===================================================================
// Full Game Win Flow
// ===================================================================
test.describe('Full Game — Win Flow', () => {
  test('complete game: start → answer → guess → win', async ({ page }) => {
    await page.goto('/jugar')
    await page.click('text=Comenzar')
    await page.waitForSelector('.question-box')

    // Answer questions until we reach guess phase
    let reachedGuess = false
    for (let i = 0; i < 25; i++) {
      // Check if we're in guess phase
      const isGuess = await page.locator('text=¿Era').isVisible().catch(() => false)
      if (isGuess) {
        reachedGuess = true
        break
      }

      // Check if game ended (win/lose)
      const isWin = await page.locator('text=¡Derinator wins!').isVisible().catch(() => false)
      const isLose = await page.locator('text=¡Derrotado!').isVisible().catch(() => false)
      if (isWin || isLose) break

      // Answer "Sí" to build confidence toward a specific character
      const yesBtn = page.locator('.btn-yes')
      if (await yesBtn.isVisible().catch(() => false)) {
        await yesBtn.click()
        await page.waitForTimeout(1500)
      } else {
        break
      }
    }

    // If we reached guess phase, accept the guess
    if (reachedGuess) {
      await expect(page.locator('.guess-avatar-container')).toBeVisible()
      await page.click('.btn-yes')

      // Wait for win state
      await page.waitForTimeout(2000)
      await expect(page.locator('text=¡Derinator wins!')).toBeVisible()
      await expect(page.locator('text=Jugar de nuevo')).toBeVisible()
    }
  })
})

// ===================================================================
// Navigation Flow
// ===================================================================
test.describe('Navigation', () => {
  test('footer navigation between pages', async ({ page }) => {
    await page.goto('/')

    // Navigate to Daily Character
    const dailyLink = page.locator('.footer-label:has-text("Diario")')
    if (await dailyLink.isVisible().catch(() => false)) {
      await dailyLink.click()
      await page.waitForURL('/del-dia')
      await expect(page.locator('h1:has-text("Personaje del Día")')).toBeVisible()
    }

    // Navigate back to Home
    const homeLink = page.locator('.footer-label:has-text("Inicio")')
    if (await homeLink.isVisible().catch(() => false)) {
      await homeLink.click()
      await page.waitForURL('/')
      await expect(page.locator('h1:has-text("Derinator")')).toBeVisible()
    }
  })
})
