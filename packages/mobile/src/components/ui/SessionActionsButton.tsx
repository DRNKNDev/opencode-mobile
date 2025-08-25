import {
  Check,
  Copy,
  Link2Off,
  MoreVertical,
  Share2,
  Trash2,
} from '@tamagui/lucide-icons'
import React, { useEffect, useState } from 'react'
import { BackHandler } from 'react-native'
import { AlertDialog, Button, Sheet, Text, XStack, YStack } from 'tamagui'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'

export interface SessionActionsButtonProps {
  sessionId: string
  sessionTitle: string
  isShared: boolean
  shareUrl?: string
  onShare: () => Promise<void>
  onUnshare: () => Promise<void>
  onDelete: () => Promise<void>
  isLoading?: boolean
}

export function SessionActionsButton({
  sessionTitle,
  isShared,
  shareUrl,
  onShare,
  onUnshare,
  onDelete,
  isLoading = false,
}: SessionActionsButtonProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [unshareDialogOpen, setUnshareDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [copiedSuccess, setCopiedSuccess] = useState(false)
  const { copyToClipboard } = useCopyToClipboard()

  // Handle Android back button for dialogs
  useEffect(() => {
    const handleBackPress = () => {
      if (deleteDialogOpen) {
        setDeleteDialogOpen(false)
        return true
      }
      if (unshareDialogOpen) {
        setUnshareDialogOpen(false)
        return true
      }
      if (sheetOpen) {
        setSheetOpen(false)
        return true
      }
      return false
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    )
    return () => backHandler.remove()
  }, [deleteDialogOpen, unshareDialogOpen, sheetOpen])

  const handleShare = async () => {
    setSheetOpen(false)
    try {
      await onShare()
    } catch (error) {
      console.error('Failed to share session:', error)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return

    try {
      const success = await copyToClipboard(shareUrl)
      if (success) {
        setCopiedSuccess(true)
        setTimeout(() => setCopiedSuccess(false), 2000)
      }
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleUnshareConfirm = async () => {
    setUnshareDialogOpen(false)
    setSheetOpen(false)
    try {
      await onUnshare()
    } catch (error) {
      console.error('Failed to unshare session:', error)
    }
  }

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false)
    setSheetOpen(false)
    try {
      await onDelete()
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  return (
    <>
      <Button
        size="$3"
        chromeless
        icon={MoreVertical}
        opacity={isLoading ? 0.6 : 1}
        disabled={isLoading}
        aria-label="Session actions"
        onPress={() => setSheetOpen(true)}
        pressStyle={{
          opacity: 0.7,
        }}
      />

      <Sheet
        modal
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        snapPoints={[30]}
        dismissOnSnapToBottom
        animation="medium"
        zIndex={100_000}
        moveOnKeyboardChange
      >
        <Sheet.Overlay
          backgroundColor="$backgroundTransparent"
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Frame
          padding="$4"
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
        >
          <Sheet.Handle />

          <YStack gap="$3">
            {!isShared ? (
              <Button
                size="$4"
                chromeless
                icon={Share2}
                justifyContent="flex-start"
                onPress={handleShare}
                disabled={isLoading}
                pressStyle={{
                  backgroundColor: '$backgroundPress',
                }}
                hoverStyle={{
                  backgroundColor: '$backgroundHover',
                }}
              >
                <Text fontSize="$4">Share Session</Text>
              </Button>
            ) : (
              <>
                <Button
                  size="$4"
                  chromeless
                  icon={copiedSuccess ? Check : Copy}
                  justifyContent="flex-start"
                  onPress={handleCopyLink}
                  disabled={isLoading || !shareUrl}
                  pressStyle={{
                    backgroundColor: '$backgroundPress',
                  }}
                  hoverStyle={{
                    backgroundColor: '$backgroundHover',
                  }}
                >
                  <Text
                    fontSize="$4"
                    color={copiedSuccess ? '$green10' : '$color'}
                  >
                    {copiedSuccess ? 'Copied!' : 'Copy Share Link'}
                  </Text>
                </Button>
                <Button
                  size="$4"
                  chromeless
                  icon={Link2Off}
                  justifyContent="flex-start"
                  onPress={() => {
                    setSheetOpen(false)
                    setUnshareDialogOpen(true)
                  }}
                  disabled={isLoading}
                  pressStyle={{
                    backgroundColor: '$backgroundPress',
                  }}
                  hoverStyle={{
                    backgroundColor: '$backgroundHover',
                  }}
                >
                  <Text fontSize="$4" color="$orange10">
                    Unshare Session
                  </Text>
                </Button>
              </>
            )}
            <Button
              size="$4"
              chromeless
              icon={Trash2}
              justifyContent="flex-start"
              onPress={() => {
                setSheetOpen(false)
                setDeleteDialogOpen(true)
              }}
              disabled={isLoading}
              pressStyle={{
                backgroundColor: '$backgroundPress',
              }}
              hoverStyle={{
                backgroundColor: '$backgroundHover',
              }}
            >
              <Text fontSize="$4" color="$red10">
                Delete Session
              </Text>
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      {/* Unshare Confirmation Dialog */}
      <AlertDialog
        open={unshareDialogOpen}
        onOpenChange={setUnshareDialogOpen}
        modal
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="$backgroundTransparent"
          />
          <AlertDialog.Content
            bordered
            elevate
            key="content"
            padding="$4"
            gap="$3"
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={0.5}
            borderColor="$borderColor"
            maxWidth={400}
            width="90%"
            alignSelf="center"
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            x={0}
            scale={1}
            opacity={1}
            y={0}
          >
            <YStack gap="$3">
              <AlertDialog.Title fontSize="$6" fontWeight="600">
                Unshare Session
              </AlertDialog.Title>
              <AlertDialog.Description fontSize="$4" color="$color11">
                This will revoke the share link and prevent others from
                accessing this session. Are you sure you want to continue?
              </AlertDialog.Description>

              <XStack gap="$2" justifyContent="flex-end" marginTop="$2">
                <Button
                  size="$4"
                  chromeless
                  onPress={() => setUnshareDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="$4"
                  backgroundColor="$orange10"
                  color="white"
                  onPress={handleUnshareConfirm}
                  disabled={isLoading}
                  pressStyle={{
                    backgroundColor: '$orange11',
                  }}
                >
                  Unshare
                </Button>
              </XStack>
            </YStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        modal
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="$backgroundTransparent"
          />
          <AlertDialog.Content
            bordered
            elevate
            key="content"
            padding="$4"
            gap="$3"
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={0.5}
            borderColor="$borderColor"
            maxWidth={400}
            width="90%"
            alignSelf="center"
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            x={0}
            scale={1}
            opacity={1}
            y={0}
          >
            <YStack gap="$3">
              <AlertDialog.Title fontSize="$6" fontWeight="600">
                Delete Session
              </AlertDialog.Title>
              <AlertDialog.Description fontSize="$4" color="$color11">
                Are you sure you want to delete &ldquo;{sessionTitle}&rdquo;?
                This action cannot be undone.
              </AlertDialog.Description>

              <XStack gap="$2" justifyContent="flex-end" marginTop="$2">
                <Button
                  size="$4"
                  chromeless
                  onPress={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="$4"
                  backgroundColor="$red10"
                  color="white"
                  onPress={handleDeleteConfirm}
                  disabled={isLoading}
                  pressStyle={{
                    backgroundColor: '$red11',
                  }}
                >
                  Delete
                </Button>
              </XStack>
            </YStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </>
  )
}
