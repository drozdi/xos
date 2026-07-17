<?php



namespace IncCom\Service;



use IncCom\Entity\Account;

use Main\Entity\User;



/**

 * Checks account access rights (master / participant).

 */

class AccountAccessService

{

    /**

     * Whether the user is the account master.

     */

    public function isMaster(Account $account, User $user): bool

    {

        $master = $account->getMaster();



        return $master !== null && $master->getId() === $user->getId();

    }



    /**

     * Whether the user is master or listed in the account participants (M2M users).

     */

    public function isParticipant(Account $account, User $user): bool

    {

        if ($this->isMaster($account, $user)) {

            return true;

        }



        foreach ($account->getUsers() as $participant) {

            if ($participant->getId() === $user->getId()) {

                return true;

            }

        }



        return false;

    }



    /**

     * Whether the user may access the account (view-level).

     */

    public function canAccess(Account $account, User $user): bool

    {

        return $this->isParticipant($account, $user);

    }

}


