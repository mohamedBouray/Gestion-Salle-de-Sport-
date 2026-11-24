<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();
        $config = $app['config'];
        if (!$app->environment('testing') || $app->configurationIsCached()
            || $config->get('database.default') !== 'mysql'
            || $config->get('database.connections.mysql.database') !== 'academic_db_test'
            || $config->get('database.connections.mysql.host') !== 'db-test'
            || $config->get('database.connections.mysql.username') !== 'academic_test'
            || $config->get('database.connections.mysql.url')
            || $config->get('database.connections.mysql.unix_socket')) {
            throw new RuntimeException('Tests bloqués : utilisez le projet Docker isolé docker-compose.test.yml.');
        }
        return $app;
    }
}
