import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { verifyPackageChecksum } from '../installer'

describe('Installer - SHA256 Checksum Verification', () => {
  const testDir = path.join(__dirname, 'tmp-checksum-test')

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
  })

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should verify correct checksum', async () => {
    // Create a test file with known content
    const testFile = path.join(testDir, 'test-file.bin')
    const content = 'test content for checksum verification'
    fs.writeFileSync(testFile, content)

    // Calculate expected checksum
    const hash = crypto.createHash('sha256')
    hash.update(content)
    const expectedChecksum = hash.digest('hex')

    // Should not throw
    await expect(verifyPackageChecksum(testFile, expectedChecksum)).resolves.toBeUndefined()
  })

  it('should verify correct checksum (case insensitive)', async () => {
    // Create a test file
    const testFile = path.join(testDir, 'test-file-ci.bin')
    const content = 'test content for case insensitive check'
    fs.writeFileSync(testFile, content)

    // Calculate expected checksum in uppercase
    const hash = crypto.createHash('sha256')
    hash.update(content)
    const expectedChecksum = hash.digest('hex').toUpperCase()

    // Should not throw (lowercase file checksum vs uppercase expected)
    await expect(verifyPackageChecksum(testFile, expectedChecksum)).resolves.toBeUndefined()
  })

  it('should fail with incorrect checksum', async () => {
    // Create a test file
    const testFile = path.join(testDir, 'test-file-bad.bin')
    const content = 'test content'
    fs.writeFileSync(testFile, content)

    // Use wrong checksum
    const wrongChecksum = 'a'.repeat(64) // 64-char hex string

    // Should throw
    await expect(verifyPackageChecksum(testFile, wrongChecksum)).rejects.toThrow(
      'Checksum verification failed'
    )
  })

  it('should skip verification if checksum is not provided', async () => {
    // Create a test file
    const testFile = path.join(testDir, 'test-file-skip.bin')
    fs.writeFileSync(testFile, 'any content')

    // Should not throw even with undefined checksum
    await expect(verifyPackageChecksum(testFile, undefined)).resolves.toBeUndefined()
  })

  it('should handle missing file error', async () => {
    const nonExistentFile = path.join(testDir, 'non-existent-file.bin')
    const checksum = 'a'.repeat(64)

    // Should throw file not found error
    await expect(verifyPackageChecksum(nonExistentFile, checksum)).rejects.toThrow(
      'Failed to read file for checksum verification'
    )
  })

  it('should calculate correct SHA256 for large file', async () => {
    // Create a larger test file
    const testFile = path.join(testDir, 'large-test-file.bin')
    const largeContent = Buffer.alloc(10 * 1024 * 1024, 'a') // 10MB file

    fs.writeFileSync(testFile, largeContent)

    // Calculate expected checksum
    const hash = crypto.createHash('sha256')
    hash.update(largeContent)
    const expectedChecksum = hash.digest('hex')

    // Should verify large file correctly
    await expect(verifyPackageChecksum(testFile, expectedChecksum)).resolves.toBeUndefined()
  })
})


