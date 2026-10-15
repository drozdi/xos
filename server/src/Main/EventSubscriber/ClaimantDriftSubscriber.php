<?php

namespace Main\EventSubscriber;

use Main\Service\ClaimantManager;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Once per PHP process, dry-run claimant sync and warn if setting.json drifted from the DB.
 */
final class ClaimantDriftSubscriber implements EventSubscriberInterface
{
    private bool $checked = false;

    public function __construct(
        private readonly ClaimantManager $claimantManager,
        private readonly LoggerInterface $logger,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::REQUEST => 'onRequest'];
    }

    public function onRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest() || $this->checked) {
            return;
        }
        if (!str_starts_with($event->getRequest()->getPathInfo(), '/api')) {
            return;
        }
        $this->checked = true;
        try {
            $report = $this->claimantManager->sync(true, false);
            $changes = $report['bit_changes'] ?? [];
            $orphans = $report['orphan'] ?? [];
            if ([] !== $changes || [] !== $orphans) {
                $this->logger->warning('Claimant catalog drift. Run php bin/console main:claimant:sync', [
                    'bit_changes' => $changes,
                    'orphan' => $orphans,
                ]);
            }
        } catch (\Throwable $exception) {
            $this->logger->warning('Claimant drift check failed: '.$exception->getMessage());
        }
    }
}
